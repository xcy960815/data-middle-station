import { ScheduledEmailMapper } from '@/server/mapper/scheduledEmailMapper'
import { BaseService } from '@/server/service/baseService'
import { ScheduledEmailLogService } from '@/server/service/scheduledEmailLogService'
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
   * @param {ScheduledEmailDto.CreateScheduledEmailRequest} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async createScheduledEmail(createRequestDto: ScheduledEmailDto.CreateScheduledEmailRequest): Promise<boolean> {
    try {
      // 验证任务类型和相关字段
      if (createRequestDto.taskType === 'scheduled') {
        if (!createRequestDto.scheduleTime) {
          throw new Error('定时任务必须指定执行时间')
        }

        const scheduleTime = new Date(createRequestDto.scheduleTime)
        const now = new Date()

        if (scheduleTime <= now) {
          throw new Error('执行时间必须大于当前时间')
        }
      } else if (createRequestDto.taskType === 'recurring') {
        if (!createRequestDto.recurringDays || !createRequestDto.recurringTime) {
          throw new Error('重复任务必须指定重复日期和执行时间')
        }

        if (!Array.isArray(createRequestDto.recurringDays) || createRequestDto.recurringDays.length === 0) {
          throw new Error('重复任务必须至少选择一个执行日期')
        }
      }

      const { createdBy, updatedBy, createTime, updateTime } = await super.getDefaultInfo()

      // 计算下次执行时间
      let nextExecutionTime: string | null = null
      if (createRequestDto.taskType === 'recurring') {
        nextExecutionTime = calculateNextExecutionTime(createRequestDto.recurringDays!, createRequestDto.recurringTime!)
      } else if (createRequestDto.taskType === 'scheduled') {
        nextExecutionTime = createRequestDto.scheduleTime!
      }

      const normalizedDto: ScheduledEmailDto.CreateScheduledEmailRequest = {
        ...createRequestDto,
        id: createRequestDto.id || 0,
        scheduleTime: createRequestDto.scheduleTime || null,
        recurringDays: createRequestDto.recurringDays || null,
        recurringTime: createRequestDto.recurringTime || null,
        isActive: true,
        nextExecutionTime,
        status: 'pending',
        remark: createRequestDto.remark,
        maxRetries: createRequestDto.maxRetries ?? 3,
        retryCount: 0,
        errorMessage: null,
        createdTime: createTime,
        updatedTime: updateTime,
        executedTime: null,
        createdBy,
        updatedBy
      }
      const daoPayload = this.convertDtoToDao(normalizedDto)
      const { id: _omitId, ...createParams } = daoPayload

      // 创建任务
      const taskId = await this.scheduledEmailMapper.createScheduledEmailTask(createParams)

      logger.info(`${createRequestDto.taskType === 'scheduled' ? '定时' : '重复'}邮件任务创建成功: ${taskId}`)

      return taskId > 0
    } catch (error) {
      logger.error(`创建邮件任务失败: ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务详情
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<ScheduledEmailVo.ScheduledEmailResponse | null>}
   */
  async getScheduledEmail(
    scheduledEmailDto: ScheduledEmailDto.UpdateScheduledEmailOptions
  ): Promise<ScheduledEmailVo.ScheduledEmailResponse | null> {
    const scheduledEmailDao = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailDto.id)
    return scheduledEmailDao ? this.convertDaoToVo(scheduledEmailDao) : null
  }

  /**
   * 更新定时邮件任务
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async updateScheduledEmail(updateRequestDto: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    // 验证任务是否存在
    const scheduledEmailDao = await this.scheduledEmailMapper.getScheduledEmailTaskById(updateRequestDto.id)
    if (!scheduledEmailDao) {
      throw new Error('任务不存在')
    }

    // 验证任务状态 - 只有pending和failed状态的任务可以编辑
    if (!['pending', 'failed'].includes(scheduledEmailDao.status)) {
      throw new Error('只有待执行或失败的任务可以编辑')
    }

    // 如果更新执行时间，验证时间
    if (updateRequestDto.scheduleTime) {
      const scheduleTime = new Date(updateRequestDto.scheduleTime)
      const now = new Date()

      if (scheduleTime <= now) {
        throw new Error('执行时间必须大于当前时间')
      }
    }

    const { updatedBy, updateTime } = await super.getDefaultInfo()

    const existingDto = this.convertDaoToDto(scheduledEmailDao)
    const mergedDto: ScheduledEmailDto.CreateScheduledEmailRequest = {
      ...existingDto,
      ...updateRequestDto,
      id: updateRequestDto.id,
      taskName: updateRequestDto.taskName || existingDto.taskName,
      scheduleTime:
        updateRequestDto.scheduleTime !== undefined ? updateRequestDto.scheduleTime : existingDto.scheduleTime,
      emailConfig: updateRequestDto.emailConfig || existingDto.emailConfig,
      analyzeOptions: updateRequestDto.analyzeOptions,
      remark: updateRequestDto.remark !== undefined ? updateRequestDto.remark : existingDto.remark,
      updatedBy,
      updatedTime: updateTime,
      createdBy: existingDto.createdBy,
      createdTime: existingDto.createdTime,
      recurringDays:
        updateRequestDto.recurringDays !== undefined ? updateRequestDto.recurringDays : existingDto.recurringDays,
      recurringTime:
        updateRequestDto.recurringTime !== undefined ? updateRequestDto.recurringTime : existingDto.recurringTime,
      isActive: existingDto.isActive,
      nextExecutionTime: existingDto.nextExecutionTime,
      status: existingDto.status,
      maxRetries: existingDto.maxRetries,
      retryCount: existingDto.retryCount,
      errorMessage: existingDto.errorMessage,
      executedTime: existingDto.executedTime
    }
    const daoPayload = this.convertDtoToDao(mergedDto)

    return await this.scheduledEmailMapper.updateScheduledEmailTask(daoPayload)
  }

  /**
   * 删除定时邮件任务
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async deleteScheduledEmail(deleteRequestDto: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      // 验证任务是否存在
      const scheduledEmailDao = await this.scheduledEmailMapper.getScheduledEmailTaskById(deleteRequestDto.id)
      if (!scheduledEmailDao) {
        throw new Error('任务不存在')
      }

      // 验证任务状态 - 运行中的任务不能删除
      if (scheduledEmailDao.status === 'running') {
        throw new Error('正在执行的任务不能删除')
      }

      const isDeleteSuccess = await this.scheduledEmailMapper.deleteScheduledEmailTask({ id: deleteRequestDto.id })

      if (isDeleteSuccess) {
        logger.info(`定时邮件任务删除成功: ${deleteRequestDto.id}`)
      }

      return isDeleteSuccess
    } catch (error) {
      logger.error(`删除定时邮件任务失败: ${deleteRequestDto.id}, ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务列表
   * @param {ScheduledEmailDto.ScheduledEmailListRequest} query 查询参数
   * @returns {Promise<ScheduledEmailVo.ScheduledEmailResponse[]>}
   */
  async getScheduledEmailList(
    queryDto: ScheduledEmailDto.ScheduledEmailListRequest
  ): Promise<ScheduledEmailVo.ScheduledEmailResponse[]> {
    try {
      const scheduledEmailDaoList = await this.scheduledEmailMapper.getScheduledEmailList(queryDto)
      return scheduledEmailDaoList.map((scheduledEmailDao) => this.convertDaoToVo(scheduledEmailDao))
    } catch (error) {
      logger.error(`获取定时邮件任务列表失败: ${error}`)
      throw error
    }
  }

  /**
   * 切换任务状态（启用/禁用）
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async toggleTaskStatus(toggleRequestDto: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailDao = await this.scheduledEmailMapper.getScheduledEmailTaskById(toggleRequestDto.id)
      if (!scheduledEmailDao) {
        throw new Error('任务不存在')
      }

      let newStatus: 'pending' | 'cancelled'

      if (scheduledEmailDao.status === 'pending') {
        newStatus = 'cancelled'
      } else if (scheduledEmailDao.status === 'cancelled') {
        newStatus = 'pending'
        // 验证执行时间是否仍然有效
        if (scheduledEmailDao.scheduleTime) {
          const scheduleTime = new Date(scheduledEmailDao.scheduleTime)
          const now = new Date()

          if (scheduleTime <= now) {
            throw new Error('任务执行时间已过期，无法启用')
          }
        }
      } else {
        throw new Error('只有待执行或已取消的任务可以切换状态')
      }

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailDao,
        id: toggleRequestDto.id,
        status: newStatus,
        errorMessage: newStatus === 'pending' ? undefined : scheduledEmailDao.errorMessage,
        retryCount: newStatus === 'pending' ? 0 : scheduledEmailDao.retryCount,
        updatedTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      return success
    } catch (error) {
      logger.error(`切换任务状态失败: ${toggleRequestDto.id}, ${error}`)
      throw error
    }
  }

  /**
   * 立即执行任务
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async executeTask(executeRequestDto: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailDao = await this.scheduledEmailMapper.getScheduledEmailTaskById(executeRequestDto.id)
      if (!scheduledEmailDao) {
        throw new Error('任务不存在')
      }

      if (scheduledEmailDao.status !== 'pending') {
        throw new Error('只有待执行的任务可以立即执行')
      }

      return await this.processTask(scheduledEmailDao)
    } catch (error) {
      logger.error(`立即执行任务失败: ${executeRequestDto.id}, ${error}`)
      throw error
    }
  }

  /**
   * 根据任务ID执行任务（简化版，用于调度器）
   * @param {number} taskId 任务ID
   * @returns {Promise<boolean>}
   */
  async executeTaskById(taskId: number): Promise<boolean> {
    try {
      const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(taskId)
      if (!scheduledEmailTask) {
        throw new Error('任务不存在')
      }

      if (!scheduledEmailTask.isActive) {
        logger.warn(`任务 ${taskId} 未激活，跳过执行`)
        return false
      }

      return await this.processTask(scheduledEmailTask)
    } catch (error) {
      logger.error(`执行任务 ${taskId} 失败: ${error}`)
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
      const pendingTaskDaoList = await this.scheduledEmailMapper.getPendingTasks(currentTime)

      logger.info(`发现 ${pendingTaskDaoList.length} 个待执行的任务`)

      for (const taskDao of pendingTaskDaoList) {
        await this.processTask(taskDao)
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
      const exactTaskDaoList = await this.scheduledEmailMapper.getExactTimeTasks(currentTime, futureTime)

      logger.info(`发现 ${exactTaskDaoList.length} 个精确时间任务`)

      for (const taskDao of exactTaskDaoList) {
        if (!taskDao.scheduleTime) continue

        const scheduleTime = new Date(taskDao.scheduleTime)
        const timeDiff = scheduleTime.getTime() - now.getTime()

        // 如果任务在10秒内需要执行，立即处理
        if (timeDiff <= 10000 && timeDiff >= 0) {
          logger.info(`执行精确时间任务: ${taskDao.id}, 时间差: ${timeDiff}ms`)
          await this.processTask(taskDao)
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
      const retryableTaskDaoList = await this.scheduledEmailMapper.getRetryableTasks()

      logger.info(`发现 ${retryableTaskDaoList.length} 个可重试的任务`)

      for (const taskDao of retryableTaskDaoList) {
        await this.processTask(taskDao)
      }
    } catch (error) {
      logger.error(`重试失败任务失败: ${error}`)
    }
  }

  /**
   * 更新重复任务的下次执行时间
   * @param {number} taskId 任务ID
   * @returns {Promise<boolean>}
   */
  async updateNextExecutionTime(taskId: number): Promise<boolean> {
    try {
      const scheduledEmailDao = await this.scheduledEmailMapper.getScheduledEmailTaskById(taskId)
      if (!scheduledEmailDao) {
        throw new Error('任务不存在')
      }

      if (scheduledEmailDao.taskType !== 'recurring') {
        logger.info(`任务 ${taskId} 不是重复任务，无需更新下次执行时间`)
        return true
      }

      const nextExecutionTime = calculateNextExecutionTime(
        scheduledEmailDao.recurringDays!,
        scheduledEmailDao.recurringTime!
      )

      if (!nextExecutionTime) {
        logger.error(`任务 ${taskId} 无法计算下次执行时间`)
        return false
      }

      const { updatedBy, updateTime } = await super.getDefaultInfo()

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailDao,
        id: taskId,
        nextExecutionTime,
        updatedTime: updateTime,
        updatedBy
      })

      if (success) {
        logger.info(`任务 ${taskId} 下次执行时间已更新为: ${nextExecutionTime}`)
      }

      return success
    } catch (error) {
      logger.error(`更新任务 ${taskId} 下次执行时间失败: ${error}`)
      return false
    }
  }

  /**
   * 处理单个任务
   * @param {ScheduledEmailDao.ScheduledEmailOptions} scheduledEmailTask 定时任务参数
   * @returns {Promise<boolean>}
   */
  private async processTask(scheduledEmailDao: ScheduledEmailDao.ScheduledEmailOptions): Promise<boolean> {
    const startTime = Date.now()
    let success = false
    let errorMessage = ''

    const { updatedBy, updateTime } = await super.getDefaultInfo()
    const emailConfig = scheduledEmailDao.emailConfig
    const analyzeOptions = scheduledEmailDao.analyzeOptions

    try {
      // 计算时间补偿
      const scheduleTime = scheduledEmailDao.scheduleTime ? new Date(scheduledEmailDao.scheduleTime) : new Date()
      const now = new Date()
      const timeDiff = now.getTime() - scheduleTime.getTime()

      // 记录时间误差
      if (timeDiff > 0) {
        logger.warn(`任务 ${scheduledEmailDao.id} 延迟执行 ${timeDiff}ms`)
      } else if (timeDiff < -1000) {
        logger.warn(`任务 ${scheduledEmailDao.id} 提前执行 ${Math.abs(timeDiff)}ms`)
      }

      // 更新任务状态为运行中
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailDao,
        id: scheduledEmailDao.id,
        status: 'running',
        executedTime: updateTime,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 解析配置
      const baseLogMetadata = this.buildBaseLogMetadata(emailConfig, analyzeOptions, scheduledEmailDao.retryCount)

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

      // 更新任务状态为完成
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailDao,
        id: scheduledEmailDao.id,
        status: 'completed',
        errorMessage: undefined,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 记录执行日志
      await this.scheduledEmailLogService.logTaskSuccess(
        scheduledEmailDao.id,
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
        result.messageId,
        Date.now() - startTime,
        '邮件发送成功',
        this.enrichLogMetadata(baseLogMetadata, result)
      )

      success = true
      logger.info(`任务执行成功: ${scheduledEmailDao.id}, messageId: ${result.messageId}`)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : '未知错误'

      // 增加重试次数
      const newRetryCount = scheduledEmailDao.retryCount + 1
      const status = newRetryCount >= scheduledEmailDao.maxRetries ? 'failed' : 'pending'

      // 更新任务状态
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailDao,
        id: scheduledEmailDao.id,
        status,
        errorMessage: errorMessage,
        retryCount: newRetryCount,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 记录执行日志
      await this.scheduledEmailLogService.logTaskFailure(
        scheduledEmailDao.id,
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
        errorMessage,
        Date.now() - startTime,
        '邮件发送失败',
        {
          ...this.buildBaseLogMetadata(emailConfig, analyzeOptions, newRetryCount),
          providerResponse: errorMessage,
          rawResponsePayload: {
            error: errorMessage
          }
        }
      )

      logger.error(
        `任务执行失败: ${scheduledEmailDao.id}, 重试次数: ${newRetryCount}/${scheduledEmailDao.maxRetries}, 错误: ${errorMessage}`
      )
    }

    return success
  }

  /**
   * 获取任务执行日志
   * @param {number} taskId 任务ID
   * @param {number} limit 日志数量限制
   */
  async getScheduledEmailLogList(taskId: number, limit: number = 20): Promise<ScheduledEmailDto.ExecutionLog[]> {
    try {
      const result = await this.scheduledEmailLogService.getExecutionLogList({
        taskId,
        limit
      })
      return result.logs.map((log) => ({
        id: log.id,
        task_id: log.taskId,
        execution_time: log.executionTime,
        execution_timezone: log.executionTimezone,
        status: log.status,
        error_message: log.errorDetails,
        email_message_id: log.emailMessageId,
        sender_email: log.senderEmail,
        sender_name: log.senderName,
        recipient_to: log.recipientTo,
        recipient_cc: log.recipientCc,
        recipient_bcc: log.recipientBcc,
        email_subject: log.emailSubject,
        attachment_count: log.attachmentCount,
        attachment_names: log.attachmentNames,
        email_channel: log.emailChannel,
        provider: log.provider,
        provider_response: log.providerResponse,
        accepted_recipients: log.acceptedRecipients,
        rejected_recipients: log.rejectedRecipients,
        retry_count: log.retryCount,
        duration: log.executionDuration,
        smtp_host: log.smtpHost,
        smtp_port: log.smtpPort,
        created_at: log.createdTime,
        created_timezone: log.createdTimezone
      }))
    } catch (error) {
      logger.error(`获取任务执行日志失败: ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 转换DAO对象为VO对象
   * @param {ScheduledEmailDao.ScheduledEmailOptions} dao DAO对象
   * @returns {ScheduledEmailVo.ScheduledEmailResponse}
   */
  private convertDaoToVo(dao: ScheduledEmailDao.ScheduledEmailOptions): ScheduledEmailVo.ScheduledEmailResponse {
    const dtoPayload = this.convertDaoToDto(dao)
    return {
      id: dtoPayload.id,
      taskName: dtoPayload.taskName,
      taskType: dtoPayload.taskType,
      scheduleTime: dtoPayload.scheduleTime || null,
      recurringDays: dtoPayload.recurringDays || null,
      recurringTime: dtoPayload.recurringTime || null,
      isActive: dtoPayload.isActive,
      nextExecutionTime: dtoPayload.nextExecutionTime || null,
      emailConfig: {
        to: Array.isArray(dtoPayload.emailConfig.to) ? dtoPayload.emailConfig.to.join(',') : dtoPayload.emailConfig.to,
        subject: dtoPayload.emailConfig.subject,
        additionalContent: dtoPayload.emailConfig.additionalContent
      },
      analyzeOptions: dtoPayload.analyzeOptions,
      status: dtoPayload.status,
      remark: dtoPayload.remark,
      createdTime: dtoPayload.createdTime,
      updatedTime: dtoPayload.updatedTime,
      executedTime: dtoPayload.executedTime || null,
      errorMessage: dtoPayload.errorMessage,
      retryCount: dtoPayload.retryCount,
      maxRetries: dtoPayload.maxRetries,
      createdBy: dtoPayload.createdBy,
      updatedBy: dtoPayload.updatedBy
    }
  }

  private convertDaoToDto(dao: ScheduledEmailDao.ScheduledEmailOptions): ScheduledEmailDto.CreateScheduledEmailRequest {
    return {
      id: dao.id,
      taskName: dao.taskName,
      scheduleTime: dao.scheduleTime || null,
      taskType: dao.taskType,
      recurringDays: dao.recurringDays || null,
      recurringTime: dao.recurringTime || null,
      isActive: dao.isActive,
      nextExecutionTime: dao.nextExecutionTime || null,
      emailConfig: {
        to: dao.emailConfig.to,
        subject: dao.emailConfig.subject,
        additionalContent: dao.emailConfig.additionalContent || ''
      },
      analyzeOptions: dao.analyzeOptions,
      status: dao.status,
      remark: dao.remark,
      maxRetries: dao.maxRetries,
      retryCount: dao.retryCount,
      errorMessage: dao.errorMessage || null,
      createdTime: dao.createdTime,
      updatedTime: dao.updatedTime,
      executedTime: dao.executedTime || null,
      createdBy: dao.createdBy,
      updatedBy: dao.updatedBy
    }
  }

  private convertDtoToDao(
    dto: ScheduledEmailDto.CreateScheduledEmailRequest | ScheduledEmailDto.UpdateScheduledEmailOptions
  ): ScheduledEmailDao.ScheduledEmailOptions {
    return {
      id: dto.id,
      taskName: dto.taskName,
      scheduleTime: dto.scheduleTime ?? null,
      taskType: dto.taskType,
      recurringDays: dto.recurringDays ?? null,
      recurringTime: dto.recurringTime ?? null,
      isActive: 'isActive' in dto ? ((dto as ScheduledEmailDto.CreateScheduledEmailRequest).isActive ?? true) : true,
      nextExecutionTime:
        'nextExecutionTime' in dto
          ? ((dto as ScheduledEmailDto.CreateScheduledEmailRequest).nextExecutionTime ?? null)
          : null,
      emailConfig: {
        to: dto.emailConfig.to,
        subject: dto.emailConfig.subject,
        additionalContent: dto.emailConfig.additionalContent
      },
      analyzeOptions: dto.analyzeOptions,
      status: 'status' in dto ? (dto as ScheduledEmailDto.CreateScheduledEmailRequest).status || 'pending' : 'pending',
      remark: dto.remark,
      createdTime: 'createdTime' in dto ? (dto as ScheduledEmailDto.CreateScheduledEmailRequest).createdTime : '',
      updatedTime: 'updatedTime' in dto ? (dto as ScheduledEmailDto.CreateScheduledEmailRequest).updatedTime : '',
      executedTime:
        'executedTime' in dto ? ((dto as ScheduledEmailDto.CreateScheduledEmailRequest).executedTime ?? null) : null,
      errorMessage:
        'errorMessage' in dto ? ((dto as ScheduledEmailDto.CreateScheduledEmailRequest).errorMessage ?? null) : null,
      retryCount: 'retryCount' in dto ? ((dto as ScheduledEmailDto.CreateScheduledEmailRequest).retryCount ?? 0) : 0,
      maxRetries: 'maxRetries' in dto ? ((dto as ScheduledEmailDto.CreateScheduledEmailRequest).maxRetries ?? 3) : 3,
      createdBy: 'createdBy' in dto ? (dto as ScheduledEmailDto.CreateScheduledEmailRequest).createdBy : '',
      updatedBy: 'updatedBy' in dto ? (dto as ScheduledEmailDto.CreateScheduledEmailRequest).updatedBy : ''
    }
  }

  private buildBaseLogMetadata(
    emailConfig: ScheduledEmailDto.EmailConfig,
    analyzeOptions: ScheduledEmailDto.AnalyzeOptions,
    retryCount: number
  ): Partial<ScheduledEmailLogDto.CreateLogRequest> {
    const recipients = this.normalizeRecipients(emailConfig.to)
    const timezone = this.getCurrentTimezone()
    const attachments = analyzeOptions.filename ? [analyzeOptions.filename] : []
    const transport = this.sendEmailService.getTransportInfo()
    return {
      senderEmail: this.sendEmailService.getSenderAddress(),
      recipientTo: recipients,
      emailSubject: emailConfig.subject,
      attachmentNames: attachments.length ? attachments : undefined,
      attachmentCount: attachments.length || undefined,
      emailChannel: this.sendEmailService.getChannel(),
      provider: transport.host || 'nodemailer',
      retryCount,
      executionTimezone: timezone,
      rawRequestPayload: {
        emailConfig,
        analyzeOptions
      },
      smtpHost: transport.host,
      smtpPort: transport.port
    }
  }

  private enrichLogMetadata(
    baseMetadata: Partial<ScheduledEmailLogDto.CreateLogRequest>,
    sendResult: SendEmailVo.SendEmailResponse
  ): Partial<ScheduledEmailLogDto.CreateLogRequest> {
    const attachments = sendResult.attachments
      ?.map((item) => item.filename)
      .filter((item): item is string => Boolean(item))
    const accepted = this.flattenNodemailerRecipients(sendResult.accepted)
    const rejected = this.flattenNodemailerRecipients(sendResult.rejected)
    const envelopeRecipients =
      sendResult.envelope?.to && sendResult.envelope.to.length > 0 ? sendResult.envelope.to : undefined

    return {
      ...baseMetadata,
      senderEmail: sendResult.sender || baseMetadata.senderEmail,
      recipientTo: envelopeRecipients || baseMetadata.recipientTo,
      attachmentNames: attachments && attachments.length > 0 ? attachments : baseMetadata.attachmentNames,
      attachmentCount:
        typeof sendResult.attachments?.length !== 'undefined'
          ? sendResult.attachments.length
          : baseMetadata.attachmentCount,
      emailChannel: sendResult.channel || baseMetadata.emailChannel,
      provider: sendResult.transport?.host || baseMetadata.provider || 'nodemailer',
      providerResponse: sendResult.response || baseMetadata.providerResponse,
      acceptedRecipients: accepted || baseMetadata.acceptedRecipients,
      rejectedRecipients: rejected || baseMetadata.rejectedRecipients,
      rawResponsePayload: sendResult,
      smtpHost: sendResult.transport?.host || baseMetadata.smtpHost,
      smtpPort: sendResult.transport?.port || baseMetadata.smtpPort
    }
  }

  private normalizeRecipients(recipients?: string | string[]): string[] {
    if (!recipients) {
      return []
    }
    if (Array.isArray(recipients)) {
      return recipients.map((recipient) => recipient.trim()).filter(Boolean)
    }
    return recipients
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  private flattenNodemailerRecipients(
    recipients?: (string | { name?: string; address: string })[]
  ): string[] | undefined {
    if (!recipients || recipients.length === 0) {
      return undefined
    }
    const normalized = recipients
      .map((recipient) => (typeof recipient === 'string' ? recipient : recipient.address))
      .filter((address): address is string => Boolean(address))
    return normalized.length > 0 ? normalized : undefined
  }

  private getCurrentTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }
}
