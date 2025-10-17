import { ScheduledEmailMapper } from '../mapper/scheduledEmailMapper'
import { calculateNextExecutionTime } from '../utils/schedulerUtils'
import { SendEmail } from '../utils/sendEmail'
import { BaseService } from './baseService'
import { ScheduledEmailLogService } from './scheduledEmailLogService'

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
   * 邮件发送工具
   */
  private sendEmailUtil: SendEmail

  constructor() {
    super()
    this.scheduledEmailMapper = new ScheduledEmailMapper()
    this.scheduledEmailLogService = new ScheduledEmailLogService()
    this.sendEmailUtil = new SendEmail()
  }

  /**
   * 创建定时邮件任务
   * @param {ScheduledEmailDto.CreateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async createScheduledEmail(scheduledEmailOptions: ScheduledEmailDto.CreateScheduledEmailOptions): Promise<boolean> {
    try {
      // 验证任务类型和相关字段
      if (scheduledEmailOptions.taskType === 'scheduled') {
        if (!scheduledEmailOptions.scheduleTime) {
          throw new Error('定时任务必须指定执行时间')
        }

        const scheduleTime = new Date(scheduledEmailOptions.scheduleTime)
        const now = new Date()

        if (scheduleTime <= now) {
          throw new Error('执行时间必须大于当前时间')
        }
      } else if (scheduledEmailOptions.taskType === 'recurring') {
        if (!scheduledEmailOptions.recurringDays || !scheduledEmailOptions.recurringTime) {
          throw new Error('重复任务必须指定重复日期和执行时间')
        }

        if (!Array.isArray(scheduledEmailOptions.recurringDays) || scheduledEmailOptions.recurringDays.length === 0) {
          throw new Error('重复任务必须至少选择一个执行日期')
        }
      }

      const { createdBy, updatedBy, createTime, updateTime } = await super.getDefaultInfo()

      // 计算下次执行时间
      let nextExecutionTime: string | null = null
      if (scheduledEmailOptions.taskType === 'recurring') {
        nextExecutionTime = calculateNextExecutionTime(
          scheduledEmailOptions.recurringDays!,
          scheduledEmailOptions.recurringTime!
        )
      } else if (scheduledEmailOptions.taskType === 'scheduled') {
        nextExecutionTime = scheduledEmailOptions.scheduleTime!
      }

      // 构建数据库参数
      const createParams: ScheduledEmailDao.ScheduledEmailOptions = {
        id: 0, // 临时值，数据库会自动生成
        taskName: scheduledEmailOptions.taskName,
        taskType: scheduledEmailOptions.taskType,
        scheduleTime: scheduledEmailOptions.scheduleTime || null,
        recurringDays: scheduledEmailOptions.recurringDays || null,
        recurringTime: scheduledEmailOptions.recurringTime || null,
        isActive: true,
        nextExecutionTime: nextExecutionTime,
        emailConfig: scheduledEmailOptions.emailConfig,
        analyseOptions: scheduledEmailOptions.analyseOptions,
        status: 'pending',
        remark: scheduledEmailOptions.remark,
        createdTime: createTime,
        updatedTime: updateTime,
        executedTime: null,
        errorMessage: null,
        retryCount: 0,
        maxRetries: 3,
        createdBy: createdBy,
        updatedBy: updatedBy
      }

      // 创建任务
      const taskId = await this.scheduledEmailMapper.createScheduledEmailTask(createParams)

      logger.info(`${scheduledEmailOptions.taskType === 'scheduled' ? '定时' : '重复'}邮件任务创建成功: ${taskId}`)

      return taskId > 0
    } catch (error) {
      logger.error(`创建邮件任务失败: ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务详情
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<ScheduledEmailDto.ScheduledEmailOptions | null>}
   */
  async getScheduledEmail(
    scheduledEmailOptions: ScheduledEmailDto.UpdateScheduledEmailOptions
  ): Promise<ScheduledEmailDto.ScheduledEmailOptions | null> {
    const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailOptions.id)
    return scheduledEmailTask ? this.convertDaoToDto(scheduledEmailTask) : null
  }

  /**
   * 更新定时邮件任务
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async updateScheduledEmail(scheduledEmailOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    // 验证任务是否存在
    const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailOptions.id)
    if (!scheduledEmailTask) {
      throw new Error('任务不存在')
    }

    // 验证任务状态 - 只有pending和failed状态的任务可以编辑
    if (!['pending', 'failed'].includes(scheduledEmailTask.status)) {
      throw new Error('只有待执行或失败的任务可以编辑')
    }

    // 如果更新执行时间，验证时间
    if (scheduledEmailOptions.scheduleTime) {
      const scheduleTime = new Date(scheduledEmailOptions.scheduleTime)
      const now = new Date()

      if (scheduleTime <= now) {
        throw new Error('执行时间必须大于当前时间')
      }
    }

    const { updatedBy, updateTime } = await super.getDefaultInfo()

    // 构建更新参数
    const updateParams: ScheduledEmailDao.UpdateScheduledEmailOptions = {
      ...scheduledEmailTask,
      id: scheduledEmailOptions.id,
      taskName: scheduledEmailOptions.taskName || scheduledEmailTask.taskName,
      scheduleTime: scheduledEmailOptions.scheduleTime || scheduledEmailTask.scheduleTime,
      emailConfig: scheduledEmailOptions.emailConfig,
      analyseOptions: scheduledEmailOptions.analyseOptions,
      status: scheduledEmailTask.status,
      remark: scheduledEmailOptions.remark !== undefined ? scheduledEmailOptions.remark : scheduledEmailTask.remark,
      maxRetries: 3,
      updatedTime: updateTime,
      updatedBy: updatedBy
    }

    return await this.scheduledEmailMapper.updateScheduledEmailTask(updateParams)
  }

  /**
   * 删除定时邮件任务
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async deleteScheduledEmail(scheduledEmailOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      // 验证任务是否存在
      const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailOptions.id)
      if (!scheduledEmailTask) {
        throw new Error('任务不存在')
      }

      // 验证任务状态 - 运行中的任务不能删除
      if (scheduledEmailTask.status === 'running') {
        throw new Error('正在执行的任务不能删除')
      }

      const isDeleteSuccess = await this.scheduledEmailMapper.deleteScheduledEmailTask({ id: scheduledEmailOptions.id })

      if (isDeleteSuccess) {
        logger.info(`定时邮件任务删除成功: ${scheduledEmailOptions.id}`)
      }

      return isDeleteSuccess
    } catch (error) {
      logger.error(`删除定时邮件任务失败: ${scheduledEmailOptions.id}, ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务列表
   * @param {ScheduledEmailDto.ScheduledEmailListQuery} query 查询参数
   * @returns {Promise<ScheduledEmailVo.ScheduledEmailOptions[]>}
   */
  async getScheduledEmailList(
    query: ScheduledEmailDto.ScheduledEmailListQuery
  ): Promise<ScheduledEmailVo.ScheduledEmailOptions[]> {
    try {
      const scheduledEmailList = await this.scheduledEmailMapper.getScheduledEmailList(query)
      return scheduledEmailList.map((task) => this.convertDaoToVo(task))
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
  async toggleTaskStatus(scheduledEmailOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailOptions.id)
      if (!scheduledEmailTask) {
        throw new Error('任务不存在')
      }

      let newStatus: 'pending' | 'cancelled'

      if (scheduledEmailTask.status === 'pending') {
        newStatus = 'cancelled'
      } else if (scheduledEmailTask.status === 'cancelled') {
        newStatus = 'pending'
        // 验证执行时间是否仍然有效
        if (scheduledEmailTask.scheduleTime) {
          const scheduleTime = new Date(scheduledEmailTask.scheduleTime)
          const now = new Date()

          if (scheduleTime <= now) {
            throw new Error('任务执行时间已过期，无法启用')
          }
        }
      } else {
        throw new Error('只有待执行或已取消的任务可以切换状态')
      }

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailTask,
        id: scheduledEmailOptions.id,
        status: newStatus,
        errorMessage: newStatus === 'pending' ? undefined : scheduledEmailTask.errorMessage,
        retryCount: newStatus === 'pending' ? 0 : scheduledEmailTask.retryCount,
        updatedTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      return success
    } catch (error) {
      logger.error(`切换任务状态失败: ${scheduledEmailOptions.id}, ${error}`)
      throw error
    }
  }

  /**
   * 立即执行任务
   * @param {ScheduledEmailDto.UpdateScheduledEmailOptions} scheduledEmailOptions 定时任务参数
   * @returns {Promise<boolean>}
   */
  async executeTask(scheduledEmailOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailOptions.id)
      if (!scheduledEmailTask) {
        throw new Error('任务不存在')
      }

      if (scheduledEmailTask.status !== 'pending') {
        throw new Error('只有待执行的任务可以立即执行')
      }

      return await this.processTask(scheduledEmailTask)
    } catch (error) {
      logger.error(`立即执行任务失败: ${scheduledEmailOptions.id}, ${error}`)
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
      const pendingTasks = await this.scheduledEmailMapper.getPendingTasks(currentTime)

      logger.info(`发现 ${pendingTasks.length} 个待执行的任务`)

      for (const task of pendingTasks) {
        await this.processTask(task)
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
      const exactTasks = await this.scheduledEmailMapper.getExactTimeTasks(currentTime, futureTime)

      logger.info(`发现 ${exactTasks.length} 个精确时间任务`)

      for (const task of exactTasks) {
        if (!task.scheduleTime) continue

        const scheduleTime = new Date(task.scheduleTime)
        const timeDiff = scheduleTime.getTime() - now.getTime()

        // 如果任务在10秒内需要执行，立即处理
        if (timeDiff <= 10000 && timeDiff >= 0) {
          logger.info(`执行精确时间任务: ${task.id}, 时间差: ${timeDiff}ms`)
          await this.processTask(task)
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
      const retryableTasks = await this.scheduledEmailMapper.getRetryableTasks()

      logger.info(`发现 ${retryableTasks.length} 个可重试的任务`)

      for (const task of retryableTasks) {
        await this.processTask(task)
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
      const task = await this.scheduledEmailMapper.getScheduledEmailTaskById(taskId)
      if (!task) {
        throw new Error('任务不存在')
      }

      if (task.taskType !== 'recurring') {
        logger.info(`任务 ${taskId} 不是重复任务，无需更新下次执行时间`)
        return true
      }

      const nextExecutionTime = calculateNextExecutionTime(task.recurringDays!, task.recurringTime!)

      if (!nextExecutionTime) {
        logger.error(`任务 ${taskId} 无法计算下次执行时间`)
        return false
      }

      const { updatedBy, updateTime } = await super.getDefaultInfo()

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...task,
        id: taskId,
        nextExecutionTime: nextExecutionTime,
        updatedTime: updateTime,
        updatedBy: updatedBy
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
  private async processTask(scheduledEmailTask: ScheduledEmailDao.ScheduledEmailOptions): Promise<boolean> {
    const startTime = Date.now()
    let success = false
    let errorMessage = ''

    const { updatedBy, updateTime } = await super.getDefaultInfo()

    try {
      // 计算时间补偿
      const scheduleTime = scheduledEmailTask.scheduleTime ? new Date(scheduledEmailTask.scheduleTime) : new Date()
      const now = new Date()
      const timeDiff = now.getTime() - scheduleTime.getTime()

      // 记录时间误差
      if (timeDiff > 0) {
        logger.warn(`任务 ${scheduledEmailTask.id} 延迟执行 ${timeDiff}ms`)
      } else if (timeDiff < -1000) {
        logger.warn(`任务 ${scheduledEmailTask.id} 提前执行 ${Math.abs(timeDiff)}ms`)
      }

      // 更新任务状态为运行中
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailTask,
        id: scheduledEmailTask.id,
        status: 'running',
        executedTime: updateTime,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 解析配置
      const emailConfig = scheduledEmailTask.emailConfig
      const analyseOptions = scheduledEmailTask.analyseOptions

      // 使用 SendEmail 工具发送邮件
      const result = await this.sendEmailUtil.sendMail({
        emailConfig: {
          to: Array.isArray(emailConfig.to) ? emailConfig.to[0] : emailConfig.to,
          subject: emailConfig.subject,
          additionalContent: emailConfig.additionalContent || ''
        },
        analyseOptions: analyseOptions
      })

      // 更新任务状态为完成
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailTask,
        id: scheduledEmailTask.id,
        status: 'completed',
        errorMessage: undefined,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 记录执行日志
      await this.scheduledEmailLogService.logTaskSuccess(
        scheduledEmailTask.id,
        new Date().toISOString().slice(0, 19).replace('T', ' '),
        result.messageId,
        Date.now() - startTime,
        '邮件发送成功'
      )

      success = true
      logger.info(`任务执行成功: ${scheduledEmailTask.id}, messageId: ${result.messageId}`)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : '未知错误'

      // 增加重试次数
      const newRetryCount = scheduledEmailTask.retryCount + 1
      const status = newRetryCount >= scheduledEmailTask.maxRetries ? 'failed' : 'pending'

      // 更新任务状态
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailTask,
        id: scheduledEmailTask.id,
        status,
        errorMessage: errorMessage,
        retryCount: newRetryCount,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 记录执行日志
      await this.scheduledEmailLogService.logTaskFailure(
        scheduledEmailTask.id,
        new Date().toISOString().slice(0, 19).replace('T', ' '),
        errorMessage,
        Date.now() - startTime,
        '邮件发送失败'
      )

      logger.error(
        `任务执行失败: ${scheduledEmailTask.id}, 重试次数: ${newRetryCount}/${scheduledEmailTask.maxRetries}, 错误: ${errorMessage}`
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
        status: log.status,
        error_message: log.errorDetails,
        duration: log.executionDuration,
        created_at: log.createdTime
      }))
    } catch (error) {
      logger.error(`获取任务执行日志失败: ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 转换DAO对象为DTO对象
   * @param {ScheduledEmailDao.ScheduledEmailOptions} dao DAO对象
   * @returns {ScheduledEmailDto.ScheduledEmailOptions}
   */
  private convertDaoToDto(dao: ScheduledEmailDao.ScheduledEmailOptions): ScheduledEmailDto.ScheduledEmailOptions {
    return {
      id: dao.id,
      taskName: dao.taskName,
      taskType: dao.taskType,
      scheduleTime: dao.scheduleTime || null,
      recurringDays: dao.recurringDays || null,
      recurringTime: dao.recurringTime || null,
      isActive: dao.isActive,
      nextExecutionTime: dao.nextExecutionTime || null,
      emailConfig: {
        to: Array.isArray(dao.emailConfig.to) ? dao.emailConfig.to.join(',') : dao.emailConfig.to,
        subject: dao.emailConfig.subject,
        additionalContent: dao.emailConfig.additionalContent
      },
      analyseOptions: dao.analyseOptions,
      status: dao.status,
      remark: dao.remark,
      createdTime: dao.createdTime,
      updatedTime: dao.updatedTime,
      executedTime: dao.executedTime,
      errorMessage: dao.errorMessage,
      retryCount: dao.retryCount,
      maxRetries: dao.maxRetries,
      createdBy: dao.createdBy,
      updatedBy: dao.updatedBy
    }
  }

  /**
   * 转换DAO对象为VO对象
   * @param {ScheduledEmailDao.ScheduledEmailOptions} dao 定时邮件任务选项
   * @returns {ScheduledEmailVo.ScheduledEmailOptions} 定时邮件任务选项
   */
  private convertDaoToVo(dao: ScheduledEmailDao.ScheduledEmailOptions): ScheduledEmailVo.ScheduledEmailOptions {
    return {
      ...dao
    }
  }
}
