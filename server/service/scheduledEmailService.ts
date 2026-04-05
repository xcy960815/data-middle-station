import { ScheduledEmailMapper } from '@/server/mapper/scheduledEmailMapper'
import { BaseService } from '@/server/service/baseService'
import { ScheduledEmailLogService } from '@/server/service/scheduledEmailLogService'
import { removeScheduledEmailJob, upsertScheduledEmailJob } from '@/server/service/scheduledEmailSchedulerService'
import { SendEmailService } from '@/server/service/sendEmailService'
import { calculateNextExecutionTime } from '@/server/utils/schedulerUtils'
import dayjs from 'dayjs'

const logger = new Logger({ fileName: 'scheduled-email', folderName: 'server' })

/**
 * 定时邮件服务
 */
export class ScheduledEmailService extends BaseService {
  /**
   * 定时任务映射器
   */
  private scheduledEmailMapper: ScheduledEmailMapper
  /**
   * 定时任务日志服务
   */
  private scheduledEmailLogService: ScheduledEmailLogService
  /**
   * 邮件发送服务
   */
  private sendEmailService: SendEmailService
  constructor() {
    super()
    this.scheduledEmailMapper = new ScheduledEmailMapper()
    this.scheduledEmailLogService = new ScheduledEmailLogService()
    this.sendEmailService = new SendEmailService()
  }

  /**
   * 创建定时邮件任务
   * @param {ScheduledEmailDto.CreateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async createScheduledEmailTask(createOptions: ScheduledEmailDto.CreateScheduledEmailOptions): Promise<boolean> {
    try {
      // 验证任务类型和相关字段
      if (createOptions.taskType === 'scheduled') {
        if (!createOptions.scheduleTime) {
          throw new Error('定时任务必须指定执行时间')
        }

        const scheduleTime = new Date(createOptions.scheduleTime)
        const now = new Date()

        if (scheduleTime <= now) {
          throw new Error('执行时间必须大于当前时间')
        }
      } else if (createOptions.taskType === 'recurring') {
        if (!createOptions.recurringDays || !createOptions.recurringTime) {
          throw new Error('重复任务必须指定重复日期和执行时间')
        }

        if (!Array.isArray(createOptions.recurringDays) || createOptions.recurringDays.length === 0) {
          throw new Error('重复任务必须至少选择一个执行日期')
        }
      }

      const { createdBy, updatedBy, createTime, updateTime } = await super.getDefaultInfo()

      const nextExecutionTime = this.calculateTaskNextExecutionTime(createOptions)

      const createParams: ScheduledEmailDao.CreateScheduledEmailOptions = {
        taskName: createOptions.taskName,
        scheduleTime: createOptions.scheduleTime || null,
        taskType: createOptions.taskType,
        recurringDays: createOptions.recurringDays || null,
        recurringTime: createOptions.recurringTime || null,
        isActive: true,
        nextExecutionTime,
        emailConfig: createOptions.emailConfig,
        analyzeOptions: createOptions.analyzeOptions,
        status: 'pending',
        remark: createOptions.remark,
        maxRetries: 3,
        retryCount: 0,
        errorMessage: null,
        createdTime: createTime,
        updatedTime: updateTime,
        executedTime: null,
        createdBy,
        updatedBy
      }

      // 创建任务
      const taskId = await this.scheduledEmailMapper.createScheduledEmailTask(createParams)

      if (taskId > 0) {
        const createdTask = await this.getScheduledEmailTask({ id: taskId })
        if (createdTask) {
          upsertScheduledEmailJob(createdTask)
        }
      }

      logger.info(`${createOptions.taskType === 'scheduled' ? '定时' : '重复'}邮件任务创建成功: ${taskId}`)

      return taskId > 0
    } catch (error) {
      logger.error(`创建邮件任务失败: ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务详情
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} queryOptions 定时任务参数
   * @returns {Promise<ScheduledEmailVo.ScheduledEmailOptions | null>}
   */
  async getScheduledEmailTask(
    queryOptions: ScheduledEmailDto.GetScheduledEmailOptions
  ): Promise<ScheduledEmailVo.ScheduledEmailOptions | null> {
    const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask(queryOptions)
    return scheduledEmailRecord ? this.convertDaoToVo(scheduledEmailRecord) : null
  }

  /**
   * 更新定时邮件任务
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async updateScheduledEmailTask(updateOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    // 验证任务是否存在
    const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask({
      id: updateOptions.id
    })
    if (!scheduledEmailRecord) {
      throw new Error('任务不存在')
    }

    // 验证任务状态 - 只有pending和failed状态的任务可以编辑
    if (!['pending', 'failed'].includes(scheduledEmailRecord.status)) {
      throw new Error('只有待执行或失败的任务可以编辑')
    }

    // 如果更新执行时间，验证时间
    if (updateOptions.scheduleTime) {
      const scheduleTime = new Date(updateOptions.scheduleTime)
      const now = new Date()

      if (scheduleTime <= now) {
        throw new Error('执行时间必须大于当前时间')
      }
    }

    const finalTaskType = updateOptions.taskType || scheduledEmailRecord.taskType
    const finalScheduleTime =
      finalTaskType === 'scheduled'
        ? updateOptions.scheduleTime !== undefined
          ? updateOptions.scheduleTime
          : scheduledEmailRecord.scheduleTime
        : null
    const finalRecurringDays =
      finalTaskType === 'recurring'
        ? updateOptions.recurringDays !== undefined
          ? updateOptions.recurringDays
          : scheduledEmailRecord.recurringDays
        : null
    const finalRecurringTime =
      finalTaskType === 'recurring'
        ? updateOptions.recurringTime !== undefined
          ? updateOptions.recurringTime
          : scheduledEmailRecord.recurringTime
        : null

    if (finalTaskType === 'scheduled' && !finalScheduleTime) {
      throw new Error('定时任务必须指定执行时间')
    }

    if (finalTaskType === 'recurring' && (!finalRecurringDays || !finalRecurringTime)) {
      throw new Error('重复任务必须指定重复日期和执行时间')
    }

    const { updatedBy, updateTime } = await super.getDefaultInfo()

    const updateParams: ScheduledEmailDao.UpdateScheduledEmailOptions = {
      ...scheduledEmailRecord,
      id: updateOptions.id,
      taskType: finalTaskType,
      taskName: updateOptions.taskName || scheduledEmailRecord.taskName,
      scheduleTime: finalScheduleTime,
      emailConfig: updateOptions.emailConfig || scheduledEmailRecord.emailConfig,
      analyzeOptions: updateOptions.analyzeOptions || scheduledEmailRecord.analyzeOptions,
      remark: updateOptions.remark !== undefined ? updateOptions.remark : scheduledEmailRecord.remark,
      recurringDays: finalRecurringDays,
      recurringTime: finalRecurringTime,
      nextExecutionTime: this.calculateTaskNextExecutionTime({
        taskType: finalTaskType,
        scheduleTime: finalScheduleTime,
        recurringDays: finalRecurringDays,
        recurringTime: finalRecurringTime
      }),
      updatedBy,
      updatedTime: updateTime
    }

    const success = await this.scheduledEmailMapper.updateScheduledEmailTask(updateParams)
    if (success) {
      const updatedTask = await this.getScheduledEmailTask({ id: updateOptions.id })
      if (updatedTask) {
        upsertScheduledEmailJob(updatedTask)
      }
    }
    return success
  }

  /**
   * 删除定时邮件任务
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async deleteScheduledEmailTask(deleteOptions: ScheduledEmailDto.DeleteScheduledEmailOptions): Promise<boolean> {
    try {
      // 验证任务是否存在
      const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask(deleteOptions)
      if (!scheduledEmailRecord) {
        throw new Error('任务不存在')
      }

      // 验证任务状态 - 运行中的任务不能删除
      if (scheduledEmailRecord.status === 'running') {
        throw new Error('正在执行的任务不能删除')
      }

      const deletedCount = await this.scheduledEmailMapper.deleteScheduledEmailTask(deleteOptions)

      if (deletedCount > 0) {
        removeScheduledEmailJob(deleteOptions.id)
        logger.info(`定时邮件任务删除成功: ${JSON.stringify(deleteOptions)}，删除数量 ${deletedCount}`)
      }

      return deletedCount > 0
    } catch (error) {
      logger.error(`删除定时邮件任务失败: ${JSON.stringify(deleteOptions)}, ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务列表
   * @param {ScheduledEmailDto.ScheduledEmailListQuery} listOptions 查询参数
   * @returns {Promise<ScheduledEmailVo.ScheduledEmailOptions[]>}
   */
  async getScheduledEmailTaskList(
    scheduledEmailListQuery: ScheduledEmailDto.ScheduledEmailListQuery
  ): Promise<ScheduledEmailVo.ScheduledEmailOptions[]> {
    try {
      const scheduledEmailRecordList =
        await this.scheduledEmailMapper.getScheduledEmailTaskList(scheduledEmailListQuery)
      return scheduledEmailRecordList.map((scheduledEmailDao) => this.convertDaoToVo(scheduledEmailDao))
    } catch (error) {
      logger.error(`获取定时邮件任务列表失败: ${JSON.stringify(scheduledEmailListQuery)}, ${error}`)
      throw error
    }
  }

  /**
   * 切换任务状态（启用/禁用）
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async toggleTaskStatus(toggleOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask({
        id: toggleOptions.id
      })
      if (!scheduledEmailRecord) {
        throw new Error('任务不存在')
      }

      let newStatus: 'pending' | 'cancelled'
      let nextExecutionTime = scheduledEmailRecord.nextExecutionTime || null

      if (scheduledEmailRecord.status === 'pending') {
        newStatus = 'cancelled'
      } else if (scheduledEmailRecord.status === 'cancelled') {
        newStatus = 'pending'
        // 验证执行时间是否仍然有效
        if (scheduledEmailRecord.scheduleTime) {
          const scheduleTime = new Date(scheduledEmailRecord.scheduleTime)
          const now = new Date()

          if (scheduleTime <= now) {
            throw new Error('任务执行时间已过期，无法启用')
          }
        }

        if (scheduledEmailRecord.taskType === 'recurring') {
          nextExecutionTime = this.calculateTaskNextExecutionTime({
            taskType: scheduledEmailRecord.taskType,
            recurringDays: scheduledEmailRecord.recurringDays,
            recurringTime: scheduledEmailRecord.recurringTime
          })
        }
      } else {
        throw new Error('只有待执行或已取消的任务可以切换状态')
      }

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailRecord,
        id: toggleOptions.id,
        status: newStatus,
        isActive: newStatus === 'pending',
        nextExecutionTime,
        errorMessage: newStatus === 'pending' ? undefined : scheduledEmailRecord.errorMessage,
        retryCount: newStatus === 'pending' ? 0 : scheduledEmailRecord.retryCount,
        updatedTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      if (success) {
        if (newStatus === 'cancelled') {
          removeScheduledEmailJob(toggleOptions.id)
        } else {
          const updatedTask = await this.getScheduledEmailTask({ id: toggleOptions.id })
          if (updatedTask) {
            upsertScheduledEmailJob(updatedTask)
          }
        }
      }

      return success
    } catch (error) {
      logger.error(`切换任务状态失败: ${toggleOptions.id}, ${error}`)
      throw error
    }
  }

  /**
   * 立即执行任务
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async executeTask(executeOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask({ id: executeOptions.id })
      if (!scheduledEmailRecord) {
        throw new Error('任务不存在')
      }

      if (!['pending', 'failed'].includes(scheduledEmailRecord.status)) {
        throw new Error('只有待执行或失败的任务可以立即执行')
      }

      return await this.processTask(scheduledEmailRecord)
    } catch (error) {
      logger.error(`立即执行任务失败: ${executeOptions.id}, ${error}`)
      throw error
    }
  }

  /**
   * 根据查询条件执行任务（简化版，用于调度器）
   * @returns {Promise<boolean>}
   */
  async executeTaskWithOptions(queryOptions: ScheduledEmailDto.ScheduledEmailQueryOptions): Promise<boolean> {
    try {
      const taskQuery: ScheduledEmailDao.ScheduledEmailQueryOptions = {
        id: queryOptions.id,
        taskName: queryOptions.taskName,
        status: queryOptions.status,
        taskType: queryOptions.taskType,
        isActive: queryOptions.isActive,
        createdBy: queryOptions.createdBy,
        updatedBy: queryOptions.updatedBy,
        minRetryCount: queryOptions.minRetryCount,
        maxRetryCount: queryOptions.maxRetryCount,
        maxRetries: queryOptions.maxRetries,
        remarkKeyword: queryOptions.remarkKeyword,
        scheduleTimeStart: queryOptions.scheduleTimeStart,
        scheduleTimeEnd: queryOptions.scheduleTimeEnd,
        nextExecutionTimeStart: queryOptions.nextExecutionTimeStart,
        nextExecutionTimeEnd: queryOptions.nextExecutionTimeEnd
      }
      const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask(taskQuery)
      if (!scheduledEmailRecord) {
        throw new Error('任务不存在')
      }

      if (!scheduledEmailRecord.isActive) {
        logger.warn(`任务 ${scheduledEmailRecord.id} 未激活，跳过执行`)
        return false
      }

      return await this.processTask(scheduledEmailRecord)
    } catch (error) {
      logger.error(`执行任务失败: ${JSON.stringify(queryOptions)}, ${error}`)
      return false
    }
  }

  /**
   * 处理待执行的任务（定时调度器调用）
   * @returns {Promise<void>}
   */
  async processPendingTasks(): Promise<void> {
    try {
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      const pendingTaskRecordList = await this.scheduledEmailMapper.getPendingTasks(currentTime)

      logger.info(`发现 ${pendingTaskRecordList.length} 个待执行的任务`)

      for (const taskRecord of pendingTaskRecordList) {
        await this.processTask(taskRecord)
      }
    } catch (error) {
      logger.error(`处理待执行任务失败: ${error}`)
    }
  }

  /**
   * 处理精确时间任务（秒级精度）
   * @returns {Promise<void>}
   */
  async processExactTimeTasks(): Promise<void> {
    try {
      const now = new Date()
      const currentTime = now.toISOString().slice(0, 19).replace('T', ' ')

      // 获取未来30秒内需要执行的任务
      const futureTime = new Date(now.getTime() + 30 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      const exactTaskRecordList = await this.scheduledEmailMapper.getExactTimeTasks(currentTime, futureTime)

      logger.info(`发现 ${exactTaskRecordList.length} 个精确时间任务`)

      for (const taskRecord of exactTaskRecordList) {
        if (!taskRecord.scheduleTime) continue

        const scheduleTime = new Date(taskRecord.scheduleTime)
        const timeDiff = scheduleTime.getTime() - now.getTime()

        // 如果任务在10秒内需要执行，立即处理
        if (timeDiff <= 10000 && timeDiff >= 0) {
          logger.info(`执行精确时间任务: ${taskRecord.id}, 时间差: ${timeDiff}ms`)
          await this.processTask(taskRecord)
        }
      }
    } catch (error) {
      logger.error(`处理精确时间任务失败: ${error}`)
    }
  }

  /**
   * 重试失败的任务
   * @returns {Promise<void>}
   */
  async retryFailedTasks(): Promise<void> {
    try {
      const retryableTaskRecordList = await this.scheduledEmailMapper.getRetryableTasks()

      logger.info(`发现 ${retryableTaskRecordList.length} 个可重试的任务`)

      for (const taskRecord of retryableTaskRecordList) {
        await this.processTask(taskRecord)
      }
    } catch (error) {
      logger.error(`重试失败任务失败: ${error}`)
    }
  }

  /**
   * 更新重复任务的下次执行时间
   * @returns {Promise<boolean>}
   */
  async updateNextExecutionTimeTask(queryOptions: ScheduledEmailDto.ScheduledEmailQueryOptions): Promise<boolean> {
    try {
      const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask(queryOptions)
      if (!scheduledEmailRecord) {
        throw new Error('任务不存在')
      }

      if (scheduledEmailRecord.taskType !== 'recurring') {
        logger.info(`任务 ${scheduledEmailRecord.id} 不是重复任务，无需更新下次执行时间`)
        return true
      }

      const nextExecutionTime = calculateNextExecutionTime(
        scheduledEmailRecord.recurringDays!,
        scheduledEmailRecord.recurringTime!
      )

      if (!nextExecutionTime) {
        logger.error(`任务 ${scheduledEmailRecord.id} 无法计算下次执行时间`)
        return false
      }

      const { updatedBy, updateTime } = await super.getDefaultInfo()

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailRecord,
        id: scheduledEmailRecord.id,
        nextExecutionTime,
        updatedTime: updateTime,
        updatedBy
      })

      if (success) {
        logger.info(`任务 ${scheduledEmailRecord.id} 下次执行时间已更新为: ${nextExecutionTime}`)
      }

      return success
    } catch (error) {
      logger.error(`更新任务下次执行时间失败: ${JSON.stringify(queryOptions)}, ${error}`)
      return false
    }
  }

  /**
   * 处理单个任务
   * @param {ScheduledEmailDao.ScheduledEmailOptions} scheduledEmailRecord 定时任务参数
   * @returns {Promise<boolean>}
   */
  private async processTask(scheduledEmailRecord: ScheduledEmailDao.ScheduledEmailOptions): Promise<boolean> {
    const startTime = Date.now()
    let success = false
    let errorMessage = ''

    const allowedStatuses: ScheduledEmailDao.Status[] =
      scheduledEmailRecord.taskType === 'recurring' ? ['pending', 'failed', 'completed'] : ['pending', 'failed']
    const claimed = await this.scheduledEmailMapper.claimTaskForExecution(scheduledEmailRecord.id, allowedStatuses)
    if (!claimed) {
      logger.warn(`任务 ${scheduledEmailRecord.id} 未抢占到执行权，跳过本次执行`)
      return false
    }

    const latestTaskRecord = await this.scheduledEmailMapper.getScheduledEmailTask({
      id: scheduledEmailRecord.id
    })
    if (!latestTaskRecord) {
      logger.error(`任务 ${scheduledEmailRecord.id} 抢占成功后未能重新读取任务详情`)
      return false
    }

    const { updatedBy, updateTime } = await super.getDefaultInfo()
    const emailConfig = latestTaskRecord.emailConfig
    const analyzeOptions = latestTaskRecord.analyzeOptions

    try {
      const expectedExecutionTime =
        latestTaskRecord.taskType === 'recurring'
          ? latestTaskRecord.nextExecutionTime || latestTaskRecord.scheduleTime
          : latestTaskRecord.scheduleTime
      const now = new Date()
      const scheduleTime = expectedExecutionTime ? new Date(expectedExecutionTime) : now
      const timeDiff = now.getTime() - scheduleTime.getTime()

      // 记录时间误差
      if (timeDiff > 0) {
        logger.warn(`任务 ${scheduledEmailRecord.id} 延迟执行 ${timeDiff}ms`)
      } else if (timeDiff < -1000) {
        logger.warn(`任务 ${scheduledEmailRecord.id} 提前执行 ${Math.abs(timeDiff)}ms`)
      }

      // 解析配置
      const baseLogMetadata = this.scheduledEmailLogService.buildTaskBaseMetadata(
        emailConfig,
        analyzeOptions,
        latestTaskRecord.retryCount
      )

      // 使用 SendEmailService 发送邮件
      const result = await this.sendEmailService.sendMail({
        emailConfig: {
          to: Array.isArray(emailConfig.to) ? emailConfig.to[0] : emailConfig.to,
          subject: emailConfig.subject,
          additionalContent: emailConfig.additionalContent || ''
        },
        analyzeOptions: {
          ...analyzeOptions
        }
      })

      const nextExecutionTime =
        latestTaskRecord.taskType === 'recurring'
          ? this.calculateTaskNextExecutionTime({
              taskType: latestTaskRecord.taskType,
              recurringDays: latestTaskRecord.recurringDays,
              recurringTime: latestTaskRecord.recurringTime
            })
          : null

      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...latestTaskRecord,
        id: latestTaskRecord.id,
        status: latestTaskRecord.taskType === 'recurring' ? 'pending' : 'completed',
        nextExecutionTime,
        errorMessage: undefined,
        retryCount: 0,
        executedTime: updateTime,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 记录执行日志
      await this.scheduledEmailLogService.logTaskSuccess(
        latestTaskRecord.id,
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
        result.messageId,
        Date.now() - startTime,
        '邮件发送成功',
        this.scheduledEmailLogService.enrichSendResultMetadata(baseLogMetadata, result)
      )

      success = true
      if (latestTaskRecord.taskType === 'scheduled') {
        removeScheduledEmailJob(latestTaskRecord.id)
      }
      logger.info(`任务执行成功: ${latestTaskRecord.id}, messageId: ${result.messageId}`)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : '未知错误'

      const newRetryCount = latestTaskRecord.retryCount + 1
      const recurringReachedMaxRetries =
        latestTaskRecord.taskType === 'recurring' && newRetryCount >= latestTaskRecord.maxRetries
      const nextExecutionTime = recurringReachedMaxRetries
        ? this.calculateTaskNextExecutionTime({
            taskType: latestTaskRecord.taskType,
            recurringDays: latestTaskRecord.recurringDays,
            recurringTime: latestTaskRecord.recurringTime
          })
        : latestTaskRecord.nextExecutionTime || null
      const status: ScheduledEmailDao.Status = recurringReachedMaxRetries ? 'pending' : 'failed'
      const persistedRetryCount = recurringReachedMaxRetries ? 0 : newRetryCount

      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...latestTaskRecord,
        id: latestTaskRecord.id,
        status,
        nextExecutionTime,
        errorMessage: errorMessage,
        retryCount: persistedRetryCount,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 记录执行日志
      await this.scheduledEmailLogService.logTaskFailure(
        latestTaskRecord.id,
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
        errorMessage,
        Date.now() - startTime,
        '邮件发送失败',
        {
          ...this.scheduledEmailLogService.buildTaskBaseMetadata(emailConfig, analyzeOptions, newRetryCount),
          providerResponse: errorMessage,
          rawResponsePayload: {
            error: errorMessage
          }
        }
      )

      logger.error(
        `任务执行失败: ${latestTaskRecord.id}, 重试次数: ${newRetryCount}/${latestTaskRecord.maxRetries}, 错误: ${errorMessage}`
      )
    }

    return success
  }

  private calculateTaskNextExecutionTime(taskOptions: {
    taskType: ScheduledEmailDao.TaskType
    scheduleTime?: string | null
    recurringDays?: number[] | null
    recurringTime?: string | null
  }): string | null {
    if (taskOptions.taskType === 'recurring') {
      if (!taskOptions.recurringDays || !taskOptions.recurringTime) {
        return null
      }
      return calculateNextExecutionTime(taskOptions.recurringDays, taskOptions.recurringTime)
    }

    return taskOptions.scheduleTime || null
  }

  /**
   * 获取任务执行日志
   */
  async getScheduledEmailLogList(
    queryOptions: ScheduledEmailLogDto.LogListQuery
  ): Promise<ScheduledEmailDto.ExecutionLog[]> {
    try {
      const normalizedLogListOptions = {
        limit: queryOptions.limit ?? 20,
        offset: queryOptions.offset ?? 0,
        ...queryOptions
      }
      const result = await this.scheduledEmailLogService.getExecutionLogList(normalizedLogListOptions)
      return result.logs.map((log) => ({
        id: log.id,
        task_id: log.taskId,
        execution_time: log.executionTime,
        execution_timezone: log.executionTimezone || undefined,
        status: log.status,
        error_message: log.errorDetails,
        email_message_id: log.emailMessageId,
        sender_email: log.senderEmail,
        sender_name: log.senderName,
        recipient_to: this.ensureStringArray(log.recipientTo),
        recipient_cc: this.ensureStringArray(log.recipientCc),
        recipient_bcc: this.ensureStringArray(log.recipientBcc),
        email_subject: log.emailSubject,
        attachment_count: log.attachmentCount,
        attachment_names: this.ensureStringArray(log.attachmentNames),
        email_channel: log.emailChannel,
        provider: log.provider || undefined,
        provider_response: log.providerResponse || undefined,
        accepted_recipients: this.ensureStringArray(log.acceptedRecipients),
        rejected_recipients: this.ensureStringArray(log.rejectedRecipients),
        retry_count: log.retryCount,
        duration: log.executionDuration,
        smtp_host: log.smtpHost || undefined,
        smtp_port: log.smtpPort || undefined,
        created_at: log.createdTime
      }))
    } catch (error) {
      logger.error(`获取任务执行日志失败: ${JSON.stringify(queryOptions)}, ${error}`)
      throw error
    }
  }

  /**
   * 转换DAO对象为VO对象
   * @param {ScheduledEmailDao.ScheduledEmailOptions} record DAO对象
   * @returns {ScheduledEmailVo.ScheduledEmailOptions}
   */
  private convertDaoToVo(record: ScheduledEmailDao.ScheduledEmailOptions): ScheduledEmailVo.ScheduledEmailOptions {
    return {
      id: record.id,
      taskName: record.taskName,
      taskType: record.taskType,
      scheduleTime: record.scheduleTime || null,
      recurringDays: record.recurringDays || null,
      recurringTime: record.recurringTime || null,
      isActive: record.isActive,
      nextExecutionTime: record.nextExecutionTime || null,
      emailConfig: {
        to: Array.isArray(record.emailConfig.to) ? record.emailConfig.to.join(',') : record.emailConfig.to,
        subject: record.emailConfig.subject,
        additionalContent: record.emailConfig.additionalContent
      },
      analyzeOptions: record.analyzeOptions,
      status: record.status,
      remark: record.remark,
      createdTime: record.createdTime,
      updatedTime: record.updatedTime,
      executedTime: record.executedTime || null,
      errorMessage: record.errorMessage,
      retryCount: record.retryCount,
      maxRetries: record.maxRetries,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy
    }
  }

  /**
   * 确保字符串数组
   * @param {string | string[] | null | undefined} value 字符串或字符串数组
   * @returns {string[] | undefined} 字符串数组
   */
  private ensureStringArray(value: string | string[] | null | undefined): string[] | undefined {
    if (!value) {
      return undefined
    }
    return Array.isArray(value) ? value : [value]
  }
}
