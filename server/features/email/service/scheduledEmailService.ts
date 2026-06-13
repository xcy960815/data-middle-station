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

/**
 * @desc 定时邮件门面服务专用日志记录器
 * @type {Logger}
 */
const logger = new Logger({ fileName: 'scheduled-email', folderName: 'server' })

/**
 * @desc 定时邮件服务（Facade）
 *  - CRUD / 列表 / 详情：直接走 Mapper
 *  - 状态切换：CRUD + 调度器联动
 *  - 立即执行 / 重试 / 回收：委派给 Executor
 *  - 日志查询：委派给 LogService
 * @class ScheduledEmailService
 * @extends {BaseService}
 */
export class ScheduledEmailService extends BaseService {
  /**
   * @desc 邮件任务数据库持久层操作 Mapper
   * @type {ScheduledEmailMapper}
   * @private
   */
  private scheduledEmailMapper: ScheduledEmailMapper
  /**
   * @desc 邮件任务执行日志服务
   * @type {ScheduledEmailLogService}
   * @private
   */
  private scheduledEmailLogService: ScheduledEmailLogService
  /**
   * @desc 邮件任务生命周期执行器服务
   * @type {ScheduledEmailExecutorService}
   * @private
   */
  private scheduledEmailExecutorService: ScheduledEmailExecutorService

  /**
   * @desc 构造函数，初始化持久层 Mapper 及各类相关服务单例
   */
  constructor() {
    super()
    this.scheduledEmailMapper = new ScheduledEmailMapper()
    this.scheduledEmailLogService = getScheduledEmailLogService()
    this.scheduledEmailExecutorService = getScheduledEmailExecutorService()
  }

  /* ============================== CRUD ============================== */

  /**
   * @desc 校验当前请求的用户是否可管理定时邮件任务。
   * @throws {Error} 若当前用户不是管理员，则抛出权限不足的异常
   */
  assertCanManageScheduledEmailTasks(): void {
    this.assertCurrentUserAdmin('仅管理员可管理定时邮件任务')
  }

  /**
   * @desc 创建定时邮件任务
   * @param {ScheduledEmailDto.CreateScheduledEmailRequest} createRequest 创建任务请求对象
   * @returns {Promise<boolean>} 是否创建成功
   * @throws {Error} 当无管理员权限、参数不合法或数据库写入异常时抛出错误
   */
  async createScheduledEmailTask(createRequest: ScheduledEmailDto.CreateScheduledEmailRequest): Promise<boolean> {
    try {
      this.assertCanManageScheduledEmailTasks()
      this.assertCreateRequest(createRequest)

      const { createdBy, updatedBy, createTime, updateTime } = await super.getDefaultInfo()
      const nextExecutionTime = calculateTaskNextExecutionTime(createRequest)

      const createParams: ScheduledEmailDao.CreateScheduledEmailParams = {
        taskName: createRequest.taskName,
        scheduleTime: createRequest.scheduleTime || null,
        taskType: createRequest.taskType,
        recurringDays: createRequest.recurringDays || null,
        recurringTime: createRequest.recurringTime || null,
        isActive: true,
        nextExecutionTime,
        emailConfig: createRequest.emailConfig,
        analyzeOptions: createRequest.analyzeOptions,
        status: TaskStatus.Pending,
        remark: createRequest.remark,
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

      logger.info(`${createRequest.taskType === TaskType.Scheduled ? '定时' : '重复'}邮件任务创建成功: ${taskId}`)

      return taskId > 0
    } catch (error) {
      logger.error(`创建邮件任务失败: ${error}`)
      throw error
    }
  }

  /**
   * @desc 获取定时邮件任务详情
   * @param {ScheduledEmailDto.GetScheduledEmailRequest} queryRequest 查询参数对象
   * @returns {Promise<ScheduledEmailVo.ScheduledEmailTaskResponse | null>} 任务详情响应 Vo，若未找到则返回 null
   */
  async getScheduledEmailTask(
    queryRequest: ScheduledEmailDto.GetScheduledEmailRequest
  ): Promise<ScheduledEmailVo.ScheduledEmailTaskResponse | null> {
    const record = await this.scheduledEmailMapper.getScheduledEmailTask(queryRequest)
    return record ? this.convertDaoToVo(record) : null
  }

  /**
   * @desc 更新定时邮件任务
   * @param {ScheduledEmailDto.UpdateScheduledEmailRequest} updateRequest 更新字段的请求参数对象
   * @returns {Promise<boolean>} 是否更新成功
   * @throws {Error} 若当前用户非管理员、任务不存在、状态不合规或参数缺失则抛出异常
   */
  async updateScheduledEmailTask(updateRequest: ScheduledEmailDto.UpdateScheduledEmailRequest): Promise<boolean> {
    this.assertCanManageScheduledEmailTasks()
    const existingRecord = await this.scheduledEmailMapper.getScheduledEmailTask({ id: updateRequest.id })
    if (!existingRecord) {
      throw new Error('任务不存在')
    }

    if (!canEditTask(existingRecord.status)) {
      throw new Error('只有待执行或失败的任务可以编辑')
    }

    if (updateRequest.scheduleTime) {
      const scheduleTime = new Date(updateRequest.scheduleTime)
      if (scheduleTime <= new Date()) {
        throw new Error('执行时间必须大于当前时间')
      }
    }

    const finalTaskType = updateRequest.taskType || existingRecord.taskType
    const finalScheduleTime =
      finalTaskType === TaskType.Scheduled
        ? updateRequest.scheduleTime !== undefined
          ? updateRequest.scheduleTime
          : existingRecord.scheduleTime
        : null
    const finalRecurringDays =
      finalTaskType === TaskType.Recurring
        ? updateRequest.recurringDays !== undefined
          ? updateRequest.recurringDays
          : existingRecord.recurringDays
        : null
    const finalRecurringTime =
      finalTaskType === TaskType.Recurring
        ? updateRequest.recurringTime !== undefined
          ? updateRequest.recurringTime
          : existingRecord.recurringTime
        : null

    if (finalTaskType === TaskType.Scheduled && !finalScheduleTime) {
      throw new Error('定时任务必须指定执行时间')
    }
    if (finalTaskType === TaskType.Recurring && (!finalRecurringDays || !finalRecurringTime)) {
      throw new Error('重复任务必须指定重复日期和执行时间')
    }

    const { updatedBy, updateTime } = await super.getDefaultInfo()

    const updateParams: ScheduledEmailDao.UpdateScheduledEmailParams = {
      ...existingRecord,
      id: updateRequest.id,
      taskType: finalTaskType,
      taskName: updateRequest.taskName || existingRecord.taskName,
      scheduleTime: finalScheduleTime,
      emailConfig: updateRequest.emailConfig || existingRecord.emailConfig,
      analyzeOptions: updateRequest.analyzeOptions || existingRecord.analyzeOptions,
      remark: updateRequest.remark !== undefined ? updateRequest.remark : existingRecord.remark,
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
      const updatedTask = await this.getScheduledEmailTask({ id: updateRequest.id })
      if (updatedTask) {
        upsertScheduledEmailJob(updatedTask)
      }
    }
    return success
  }

  /**
   * @desc 删除定时邮件任务
   * @param {ScheduledEmailDto.DeleteScheduledEmailRequest} deleteRequest 删除请求参数对象
   * @returns {Promise<boolean>} 是否删除成功
   * @throws {Error} 若无权限、任务不存在或任务正在运行中则抛出异常
   */
  async deleteScheduledEmailTask(deleteRequest: ScheduledEmailDto.DeleteScheduledEmailRequest): Promise<boolean> {
    try {
      this.assertCanManageScheduledEmailTasks()
      const existingRecord = await this.scheduledEmailMapper.getScheduledEmailTask({ id: deleteRequest.id })
      if (!existingRecord) {
        throw new Error('任务不存在')
      }
      if (!canDeleteTask(existingRecord.status)) {
        throw new Error('正在执行的任务不能删除')
      }

      const { updatedBy, updateTime } = await super.getDefaultInfo()
      const deleteParams: ScheduledEmailDao.DeleteScheduledEmailParams = {
        id: deleteRequest.id,
        updatedBy,
        updatedTime: updateTime
      }
      const deletedCount = await this.scheduledEmailMapper.deleteScheduledEmailTask(deleteParams)
      if (deletedCount > 0) {
        removeScheduledEmailJob(deleteRequest.id)
        logger.info(`定时邮件任务删除成功: ${JSON.stringify(deleteParams)}，删除数量 ${deletedCount}`)
      }

      return deletedCount > 0
    } catch (error) {
      logger.error(`删除定时邮件任务失败: ${JSON.stringify(deleteRequest)}, ${error}`)
      throw error
    }
  }

  /**
   * @desc 获取定时邮件任务列表
   * @param {ScheduledEmailDto.ScheduledEmailListRequest} listRequest 列表查询过滤条件请求
   * @returns {Promise<ScheduledEmailVo.ScheduledEmailTaskListResponse>} 邮件任务 Vo 列表响应
   * @throws {Error} 当数据库查询异常时抛出错误
   */
  async getScheduledEmailTaskList(
    listRequest: ScheduledEmailDto.ScheduledEmailListRequest
  ): Promise<ScheduledEmailVo.ScheduledEmailTaskListResponse> {
    try {
      const recordList = await this.scheduledEmailMapper.getScheduledEmailTaskList(listRequest)
      return recordList.map((dao) => this.convertDaoToVo(dao))
    } catch (error) {
      logger.error(`获取定时邮件任务列表失败: ${JSON.stringify(listRequest)}, ${error}`)
      throw error
    }
  }

  /**
   * @desc 切换任务状态（待执行 pending ↔ 已取消 cancelled）
   * @param {ScheduledEmailDto.ScheduledEmailTaskIdRequest} taskIdRequest 任务 ID 请求对象
   * @returns {Promise<boolean>} 状态变更是否成功
   * @throws {Error} 当无权限、任务不存在或状态不支持切换（非待执行且非已取消）时抛出异常
   */
  async toggleTaskStatus(taskIdRequest: ScheduledEmailDto.ScheduledEmailTaskIdRequest): Promise<boolean> {
    try {
      this.assertCanManageScheduledEmailTasks()
      const existingRecord = await this.scheduledEmailMapper.getScheduledEmailTask({ id: taskIdRequest.id })
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
        id: taskIdRequest.id,
        status: newStatus,
        isActive: newStatus === TaskStatus.Pending,
        nextExecutionTime,
        errorMessage: newStatus === TaskStatus.Pending ? undefined : existingRecord.errorMessage,
        retryCount: newStatus === TaskStatus.Pending ? 0 : existingRecord.retryCount,
        updatedTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      if (success) {
        if (newStatus === TaskStatus.Cancelled) {
          removeScheduledEmailJob(taskIdRequest.id)
        } else {
          const updatedTask = await this.getScheduledEmailTask({ id: taskIdRequest.id })
          if (updatedTask) {
            upsertScheduledEmailJob(updatedTask)
          }
        }
      }
      return success
    } catch (error) {
      logger.error(`切换任务状态失败: ${taskIdRequest.id}, ${error}`)
      throw error
    }
  }

  /* ============================== Executor 委派 ============================== */

  /**
   * @desc 立即执行任务（手动触发），将请求委派给 ScheduledEmailExecutorService 实例
   * @param {ScheduledEmailDto.ScheduledEmailTaskIdRequest} taskIdRequest 任务 ID 请求对象
   * @returns {Promise<boolean>} 是否执行发送成功
   */
  async executeTask(taskIdRequest: ScheduledEmailDto.ScheduledEmailTaskIdRequest): Promise<boolean> {
    this.assertCanManageScheduledEmailTasks()
    return this.scheduledEmailExecutorService.executeTask(taskIdRequest)
  }

  /**
   * @desc 简化版触发执行（调度器回调），将请求委派给 ScheduledEmailExecutorService 实例
   * @param {ScheduledEmailDto.ScheduledEmailQueryRequest} queryRequest 查询过滤请求对象
   * @returns {Promise<boolean>} 是否最终执行成功
   */
  async executeTaskByQuery(queryRequest: ScheduledEmailDto.ScheduledEmailQueryRequest): Promise<boolean> {
    return this.scheduledEmailExecutorService.executeTaskByQuery(queryRequest)
  }

  /**
   * @desc 批量重试所有状态为失败且未达到最大重试次数的任务，委派给 ScheduledEmailExecutorService
   * @returns {Promise<void>} 无返回值
   */
  async retryFailedTasks(): Promise<void> {
    return this.scheduledEmailExecutorService.retryFailedTasks()
  }

  /**
   * @desc 回收卡在 running 状态超过指定阈值的僵尸任务，委派给 ScheduledEmailExecutorService
   * @param {number} thresholdMinutes 超时阈值分钟数
   * @returns {Promise<number>} 实际回收并修复状态的任务数量
   */
  async recoverStaleRunningTasks(thresholdMinutes: number): Promise<number> {
    return this.scheduledEmailExecutorService.recoverStaleRunningTasks(thresholdMinutes)
  }

  /**
   * @desc 更新重复任务的下一次执行时间
   * @param {ScheduledEmailDto.ScheduledEmailQueryRequest} queryRequest 查询定位条件的请求对象
   * @returns {Promise<boolean>} 更新操作是否成功
   * @throws {Error} 当任务不存在时抛出异常
   */
  async updateNextExecutionTimeTask(queryRequest: ScheduledEmailDto.ScheduledEmailQueryRequest): Promise<boolean> {
    try {
      const existingRecord = await this.scheduledEmailMapper.getScheduledEmailTask(queryRequest)
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
      logger.error(`更新任务下次执行时间失败: ${JSON.stringify(queryRequest)}, ${error}`)
      return false
    }
  }

  /* ============================== 日志查询委派 ============================== */

  /**
   * @desc 获取任务的执行日志列表，支持限制条数和偏移分页，委派给 ScheduledEmailLogService
   * @param {ScheduledEmailLogDto.LogListRequest} queryRequest 查询和分页条件对象
   * @returns {Promise<ScheduledEmailDto.ExecutionLogItem[]>} 格式化后的执行日志数组
   * @throws {Error} 当查询底层日志发生异常时抛出错误
   */
  async getScheduledEmailLogList(
    queryRequest: ScheduledEmailLogDto.LogListRequest
  ): Promise<ScheduledEmailDto.ExecutionLogItem[]> {
    try {
      const normalizedLogListQuery = {
        limit: queryRequest.limit ?? 20,
        offset: queryRequest.offset ?? 0,
        ...queryRequest
      }
      const result = await this.scheduledEmailLogService.getExecutionLogList(normalizedLogListQuery)
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
      logger.error(`获取任务执行日志失败: ${JSON.stringify(queryRequest)}, ${error}`)
      throw error
    }
  }

  /* ============================== 内部辅助 ============================== */

  /**
   * @desc 校验创建任务请求参数的合规性
   * @param {ScheduledEmailDto.CreateScheduledEmailRequest} createRequest 创建任务请求参数
   * @throws {Error} 校验发现时间或重复天数等配置不合规时抛出对应的异常
   * @private
   */
  private assertCreateRequest(createRequest: ScheduledEmailDto.CreateScheduledEmailRequest): void {
    if (createRequest.taskType === TaskType.Scheduled) {
      if (!createRequest.scheduleTime) {
        throw new Error('定时任务必须指定执行时间')
      }
      if (new Date(createRequest.scheduleTime) <= new Date()) {
        throw new Error('执行时间必须大于当前时间')
      }
    } else if (createRequest.taskType === TaskType.Recurring) {
      if (!createRequest.recurringDays || !createRequest.recurringTime) {
        throw new Error('重复任务必须指定重复日期和执行时间')
      }
      if (!Array.isArray(createRequest.recurringDays) || createRequest.recurringDays.length === 0) {
        throw new Error('重复任务必须至少选择一个执行日期')
      }
    }
  }

  /**
   * @desc 将数据库查询出的一条原始任务记录转换为前端/调度接口的 Vo 层响应结构
   * @param {ScheduledEmailDao.ScheduledEmailRecord} record 底层数据库记录对象
   * @returns {ScheduledEmailVo.ScheduledEmailTaskResponse} 格式化转换后的前端 Vo 层响应对象
   * @private
   */
  private convertDaoToVo(record: ScheduledEmailDao.ScheduledEmailRecord): ScheduledEmailVo.ScheduledEmailTaskResponse {
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
   * @desc 确保输入的值最终以字符串数组格式输出（去除非空或兼容单字符串）
   * @param {string | string[] | null | undefined} value 原始输入参数
   * @returns {string[] | undefined} 返回字符串数组或 undefined
   * @private
   */
  private ensureStringArray(value: string | string[] | null | undefined): string[] | undefined {
    if (!value) {
      return undefined
    }
    return Array.isArray(value) ? value : [value]
  }
}

/* ============================== 单例工厂 ============================== */

/**
 * @desc ScheduledEmailService 进程级单例存储变量
 * @type {ScheduledEmailService | null}
 */
let scheduledEmailServiceInstance: ScheduledEmailService | null = null

/**
 * @desc 获取 ScheduledEmailService 的进程级单例
 *
 * 推荐 API handler / plugin 全部使用本工厂，避免：
 *  - 每个 handler 顶层 `new ScheduledEmailService()` 时反复构造整条依赖链
 *    (Executor / LogService / SendEmailService / ChartSnapshotService / AnalyzeService / ChartDataService)
 *  - 不同实例间 transporter 状态不一致、runtimeConfig 读取时机不同等隐性 bug
 * @returns {ScheduledEmailService} ScheduledEmailService 进程级单例对象
 */
export const getScheduledEmailService = (): ScheduledEmailService => {
  if (!scheduledEmailServiceInstance) {
    scheduledEmailServiceInstance = new ScheduledEmailService()
  }
  return scheduledEmailServiceInstance
}
