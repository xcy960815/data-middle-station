/**
 * @desc 定时邮件服务 - Facade（门面）
 *
 * 拆分说明：
 *  - 原 882 行的"上帝类"被拆为：
 *    - `../domain/scheduledEmailDomain.ts`     领域常量 / 状态机判定 / 时间计算（纯函数）
 *    - `./scheduledEmailExecutorService.ts`    任务执行 / 重试 / 僵尸回收
 *    - `../scheduler/scheduledEmailScheduler.ts` 内存调度器（node-schedule 包装）
 *    - 本文件                                  CRUD + 状态切换 + 转换 + 对 Executor 的 Facade
 *
 *  - 对外 API（API handler、调度插件）完全保留，调用方零侵入
 */

import { BaseService } from '@/server/service/baseService'
import {
  calculateTaskNextExecutionTime,
  canDeleteTask,
  canEditTask,
  canToggleTaskStatus,
  TaskStatus,
  TaskType
} from '../domain/scheduledEmailDomain'
import { ScheduledEmailMapper } from '../mapper/scheduledEmailMapper'
import { removeScheduledEmailJob, upsertScheduledEmailJob } from '../scheduler/scheduledEmailScheduler'
import { getScheduledEmailExecutorService, ScheduledEmailExecutorService } from './scheduledEmailExecutorService'
import { getScheduledEmailLogService, ScheduledEmailLogService } from './scheduledEmailLogService'

const logger = new Logger({ fileName: 'scheduled-email', folderName: 'server' })

/**
 * @desc 定时邮件服务（Facade）
 *  - CRUD / 列表 / 详情：直接走 Mapper
 *  - 状态切换：CRUD + 调度器联动
 *  - 立即执行 / 重试 / 回收：委派给 Executor
 *  - 日志查询：委派给 LogService
 */
export class ScheduledEmailService extends BaseService {
  private scheduledEmailMapper: ScheduledEmailMapper
  private scheduledEmailLogService: ScheduledEmailLogService
  private scheduledEmailExecutorService: ScheduledEmailExecutorService

  constructor() {
    super()
    this.scheduledEmailMapper = new ScheduledEmailMapper()
    this.scheduledEmailLogService = getScheduledEmailLogService()
    this.scheduledEmailExecutorService = getScheduledEmailExecutorService()
  }

  /* ============================== CRUD ============================== */

  /**
   * 创建定时邮件任务
   */
  async createScheduledEmailTask(createOptions: ScheduledEmailDto.CreateScheduledEmailOptions): Promise<boolean> {
    try {
      this.assertCreateOptions(createOptions)

      const { createdBy, updatedBy, createTime, updateTime } = await super.getDefaultInfo()
      const nextExecutionTime = calculateTaskNextExecutionTime(createOptions)

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
        status: TaskStatus.Pending,
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

      const taskId = await this.scheduledEmailMapper.createScheduledEmailTask(createParams)

      if (taskId > 0) {
        const createdTask = await this.getScheduledEmailTask({ id: taskId })
        if (createdTask) {
          upsertScheduledEmailJob(createdTask)
        }
      }

      logger.info(`${createOptions.taskType === TaskType.Scheduled ? '定时' : '重复'}邮件任务创建成功: ${taskId}`)

      return taskId > 0
    } catch (error) {
      logger.error(`创建邮件任务失败: ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务详情
   */
  async getScheduledEmailTask(
    queryOptions: ScheduledEmailDto.GetScheduledEmailOptions
  ): Promise<ScheduledEmailVo.ScheduledEmailOptions | null> {
    const record = await this.scheduledEmailMapper.getScheduledEmailTask(queryOptions)
    return record ? this.convertDaoToVo(record) : null
  }

  /**
   * 更新定时邮件任务
   */
  async updateScheduledEmailTask(updateOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    const existingRecord = await this.scheduledEmailMapper.getScheduledEmailTask({ id: updateOptions.id })
    if (!existingRecord) {
      throw new Error('任务不存在')
    }

    if (!canEditTask(existingRecord.status)) {
      throw new Error('只有待执行或失败的任务可以编辑')
    }

    if (updateOptions.scheduleTime) {
      const scheduleTime = new Date(updateOptions.scheduleTime)
      if (scheduleTime <= new Date()) {
        throw new Error('执行时间必须大于当前时间')
      }
    }

    const finalTaskType = updateOptions.taskType || existingRecord.taskType
    const finalScheduleTime =
      finalTaskType === TaskType.Scheduled
        ? updateOptions.scheduleTime !== undefined
          ? updateOptions.scheduleTime
          : existingRecord.scheduleTime
        : null
    const finalRecurringDays =
      finalTaskType === TaskType.Recurring
        ? updateOptions.recurringDays !== undefined
          ? updateOptions.recurringDays
          : existingRecord.recurringDays
        : null
    const finalRecurringTime =
      finalTaskType === TaskType.Recurring
        ? updateOptions.recurringTime !== undefined
          ? updateOptions.recurringTime
          : existingRecord.recurringTime
        : null

    if (finalTaskType === TaskType.Scheduled && !finalScheduleTime) {
      throw new Error('定时任务必须指定执行时间')
    }
    if (finalTaskType === TaskType.Recurring && (!finalRecurringDays || !finalRecurringTime)) {
      throw new Error('重复任务必须指定重复日期和执行时间')
    }

    const { updatedBy, updateTime } = await super.getDefaultInfo()

    const updateParams: ScheduledEmailDao.UpdateScheduledEmailOptions = {
      ...existingRecord,
      id: updateOptions.id,
      taskType: finalTaskType,
      taskName: updateOptions.taskName || existingRecord.taskName,
      scheduleTime: finalScheduleTime,
      emailConfig: updateOptions.emailConfig || existingRecord.emailConfig,
      analyzeOptions: updateOptions.analyzeOptions || existingRecord.analyzeOptions,
      remark: updateOptions.remark !== undefined ? updateOptions.remark : existingRecord.remark,
      recurringDays: finalRecurringDays,
      recurringTime: finalRecurringTime,
      nextExecutionTime: calculateTaskNextExecutionTime({
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
   */
  async deleteScheduledEmailTask(deleteOptions: ScheduledEmailDto.DeleteScheduledEmailOptions): Promise<boolean> {
    try {
      const existingRecord = await this.scheduledEmailMapper.getScheduledEmailTask({ id: deleteOptions.id })
      if (!existingRecord) {
        throw new Error('任务不存在')
      }
      if (!canDeleteTask(existingRecord.status)) {
        throw new Error('正在执行的任务不能删除')
      }

      const { updatedBy, updateTime } = await super.getDefaultInfo()
      const deleteParams: ScheduledEmailDao.DeleteScheduledEmailOptions = {
        id: deleteOptions.id,
        updatedBy,
        updatedTime: updateTime
      }
      const deletedCount = await this.scheduledEmailMapper.deleteScheduledEmailTask(deleteParams)
      if (deletedCount > 0) {
        removeScheduledEmailJob(deleteOptions.id)
        logger.info(`定时邮件任务删除成功: ${JSON.stringify(deleteParams)}，删除数量 ${deletedCount}`)
      }

      return deletedCount > 0
    } catch (error) {
      logger.error(`删除定时邮件任务失败: ${JSON.stringify(deleteOptions)}, ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务列表
   */
  async getScheduledEmailTaskList(
    scheduledEmailListQuery: ScheduledEmailDto.ScheduledEmailListQuery
  ): Promise<ScheduledEmailVo.ScheduledEmailOptions[]> {
    try {
      const recordList = await this.scheduledEmailMapper.getScheduledEmailTaskList(scheduledEmailListQuery)
      return recordList.map((dao) => this.convertDaoToVo(dao))
    } catch (error) {
      logger.error(`获取定时邮件任务列表失败: ${JSON.stringify(scheduledEmailListQuery)}, ${error}`)
      throw error
    }
  }

  /**
   * 切换任务状态（pending ↔ cancelled）
   */
  async toggleTaskStatus(toggleOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const existingRecord = await this.scheduledEmailMapper.getScheduledEmailTask({ id: toggleOptions.id })
      if (!existingRecord) {
        throw new Error('任务不存在')
      }

      if (!canToggleTaskStatus(existingRecord.status)) {
        throw new Error('只有待执行或已取消的任务可以切换状态')
      }

      let newStatus: 'pending' | 'cancelled'
      let nextExecutionTime = existingRecord.nextExecutionTime || null

      if (existingRecord.status === TaskStatus.Pending) {
        newStatus = TaskStatus.Cancelled
      } else {
        newStatus = TaskStatus.Pending
        if (existingRecord.scheduleTime) {
          const scheduleTime = new Date(existingRecord.scheduleTime)
          if (scheduleTime <= new Date()) {
            throw new Error('任务执行时间已过期，无法启用')
          }
        }
        if (existingRecord.taskType === TaskType.Recurring) {
          nextExecutionTime = calculateTaskNextExecutionTime({
            taskType: existingRecord.taskType,
            recurringDays: existingRecord.recurringDays,
            recurringTime: existingRecord.recurringTime
          })
        }
      }

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...existingRecord,
        id: toggleOptions.id,
        status: newStatus,
        isActive: newStatus === TaskStatus.Pending,
        nextExecutionTime,
        errorMessage: newStatus === TaskStatus.Pending ? undefined : existingRecord.errorMessage,
        retryCount: newStatus === TaskStatus.Pending ? 0 : existingRecord.retryCount,
        updatedTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      if (success) {
        if (newStatus === TaskStatus.Cancelled) {
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

  /* ============================== Executor 委派 ============================== */

  /**
   * 立即执行任务（手动触发）
   */
  async executeTask(executeOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    return this.scheduledEmailExecutorService.executeTask(executeOptions)
  }

  /**
   * 简化版触发执行（调度器回调）
   */
  async executeTaskWithOptions(queryOptions: ScheduledEmailDto.ScheduledEmailQueryOptions): Promise<boolean> {
    return this.scheduledEmailExecutorService.executeTaskWithOptions(queryOptions)
  }

  /**
   * 批量重试可重试的失败任务
   */
  async retryFailedTasks(): Promise<void> {
    return this.scheduledEmailExecutorService.retryFailedTasks()
  }

  /**
   * 回收卡死(running)的僵尸任务
   */
  async recoverStaleRunningTasks(thresholdMinutes: number): Promise<number> {
    return this.scheduledEmailExecutorService.recoverStaleRunningTasks(thresholdMinutes)
  }

  /**
   * 更新重复任务的下次执行时间
   */
  async updateNextExecutionTimeTask(queryOptions: ScheduledEmailDto.ScheduledEmailQueryOptions): Promise<boolean> {
    try {
      const existingRecord = await this.scheduledEmailMapper.getScheduledEmailTask(queryOptions)
      if (!existingRecord) {
        throw new Error('任务不存在')
      }

      if (existingRecord.taskType !== TaskType.Recurring) {
        logger.info(`任务 ${existingRecord.id} 不是重复任务，无需更新下次执行时间`)
        return true
      }

      const nextExecutionTime = calculateTaskNextExecutionTime({
        taskType: existingRecord.taskType,
        recurringDays: existingRecord.recurringDays,
        recurringTime: existingRecord.recurringTime
      })

      if (!nextExecutionTime) {
        logger.error(`任务 ${existingRecord.id} 无法计算下次执行时间`)
        return false
      }

      const { updatedBy, updateTime } = await super.getDefaultInfo()

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...existingRecord,
        id: existingRecord.id,
        nextExecutionTime,
        updatedTime: updateTime,
        updatedBy
      })

      if (success) {
        logger.info(`任务 ${existingRecord.id} 下次执行时间已更新为: ${nextExecutionTime}`)
      }

      return success
    } catch (error) {
      logger.error(`更新任务下次执行时间失败: ${JSON.stringify(queryOptions)}, ${error}`)
      return false
    }
  }

  /* ============================== 日志查询委派 ============================== */

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

  /* ============================== 内部辅助 ============================== */

  /**
   * 校验创建参数
   */
  private assertCreateOptions(createOptions: ScheduledEmailDto.CreateScheduledEmailOptions): void {
    if (createOptions.taskType === TaskType.Scheduled) {
      if (!createOptions.scheduleTime) {
        throw new Error('定时任务必须指定执行时间')
      }
      if (new Date(createOptions.scheduleTime) <= new Date()) {
        throw new Error('执行时间必须大于当前时间')
      }
    } else if (createOptions.taskType === TaskType.Recurring) {
      if (!createOptions.recurringDays || !createOptions.recurringTime) {
        throw new Error('重复任务必须指定重复日期和执行时间')
      }
      if (!Array.isArray(createOptions.recurringDays) || createOptions.recurringDays.length === 0) {
        throw new Error('重复任务必须至少选择一个执行日期')
      }
    }
  }

  /**
   * DAO -> VO
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

  private ensureStringArray(value: string | string[] | null | undefined): string[] | undefined {
    if (!value) {
      return undefined
    }
    return Array.isArray(value) ? value : [value]
  }
}

/* ============================== 单例工厂 ============================== */

let scheduledEmailServiceInstance: ScheduledEmailService | null = null

/**
 * @desc 获取 ScheduledEmailService 的进程级单例
 *
 * 推荐 API handler / plugin 全部使用本工厂，避免：
 *  - 每个 handler 顶层 `new ScheduledEmailService()` 时反复构造整条依赖链
 *    (Executor / LogService / SendEmailService / ChartSnapshotService / AnalyzeService / ChartDataService)
 *  - 不同实例间 transporter 状态不一致、runtimeConfig 读取时机不同等隐性 bug
 */
export const getScheduledEmailService = (): ScheduledEmailService => {
  if (!scheduledEmailServiceInstance) {
    scheduledEmailServiceInstance = new ScheduledEmailService()
  }
  return scheduledEmailServiceInstance
}
