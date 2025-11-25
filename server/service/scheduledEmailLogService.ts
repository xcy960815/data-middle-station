import { ScheduledEmailLogMapper } from '@/server/mapper/scheduledEmailLogMapper'
import { BaseService } from '@/server/service/baseService'

const logger = new Logger({ fileName: 'scheduled-email-log', folderName: 'server' })

/**
 * 定时邮件日志服务
 */
export class ScheduledEmailLogService extends BaseService {
  private scheduledEmailLogMapper: ScheduledEmailLogMapper

  constructor() {
    super()
    this.scheduledEmailLogMapper = new ScheduledEmailLogMapper()
  }

  /**
   * 创建执行日志
   */
  async createExecutionLog(logRequest: ScheduledEmailLogDto.CreateLogRequest): Promise<number> {
    try {
      const { createTime, createdBy } = await super.getDefaultInfo()
      const timezone = logRequest.executionTimezone || this.getCurrentTimezone()
      const createdTimezone = logRequest.createdTimezone || timezone
      const logData: ScheduledEmailLogDao.CreateScheduledEmailLogOptions = {
        taskId: logRequest.taskId,
        executionTime: logRequest.executionTime,
        executionTimezone: timezone,
        status: logRequest.status,
        message: logRequest.message,
        errorDetails: logRequest.errorDetails,
        emailMessageId: logRequest.emailMessageId,
        senderEmail: logRequest.senderEmail || 'system@unknown',
        senderName: logRequest.senderName,
        recipientTo: logRequest.recipientTo && logRequest.recipientTo.length > 0 ? logRequest.recipientTo : [],
        recipientCc: logRequest.recipientCc,
        recipientBcc: logRequest.recipientBcc,
        replyTo: logRequest.replyTo,
        emailSubject: logRequest.emailSubject,
        attachmentCount: logRequest.attachmentCount,
        attachmentNames: logRequest.attachmentNames,
        emailChannel: logRequest.emailChannel,
        provider: logRequest.provider,
        providerResponse: logRequest.providerResponse,
        acceptedRecipients: logRequest.acceptedRecipients,
        rejectedRecipients: logRequest.rejectedRecipients,
        retryCount: logRequest.retryCount,
        rawRequestPayload: logRequest.rawRequestPayload,
        rawResponsePayload: logRequest.rawResponsePayload,
        smtpHost: logRequest.smtpHost,
        smtpPort: logRequest.smtpPort,
        executionDuration: logRequest.executionDuration,
        createdTime: createTime,
        createdTimezone,
        createdBy
      }

      const logId = await this.scheduledEmailLogMapper.createScheduledEmailLog(logData)

      if (logId > 0) {
        logger.info(`执行日志创建成功: 任务ID ${logRequest.taskId}, 日志ID ${logId}, 状态: ${logRequest.status}`)
      }

      return logId
    } catch (error) {
      logger.error(`创建执行日志失败: 任务ID ${logRequest.taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 根据ID获取执行日志
   */
  async getExecutionLogById(id: number): Promise<ScheduledEmailLogDto.ExecutionLog | null> {
    try {
      const log = await this.scheduledEmailLogMapper.getScheduledEmailLogById(id)
      return log ? this.convertDaoToDto(log) : null
    } catch (error) {
      logger.error(`获取执行日志失败: ID ${id}, ${error}`)
      throw error
    }
  }

  /**
   * 获取任务执行日志列表
   */
  async getExecutionLogList(query: ScheduledEmailLogDto.LogListQuery): Promise<ScheduledEmailLogDto.LogListResponse> {
    try {
      const limit = query.limit || 50
      const offset = query.offset || 0

      // 获取日志列表和总数
      const [logs, total] = await Promise.all([
        this.scheduledEmailLogMapper.getScheduledEmailLogList(query),
        this.scheduledEmailLogMapper.getScheduledEmailLogCount(query)
      ])

      return {
        logs: logs.map((log) => this.convertDaoToDto(log)),
        total,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    } catch (error) {
      logger.error(`获取执行日志列表失败: ${JSON.stringify(query)}, ${error}`)
      throw error
    }
  }

  /**
   * 获取任务的最新执行日志
   */
  async getLatestExecutionLog(taskId: number): Promise<ScheduledEmailLogDto.ExecutionLog | null> {
    try {
      const log = await this.scheduledEmailLogMapper.getLatestLogByTaskId(taskId)
      return log ? this.convertDaoToDto(log) : null
    } catch (error) {
      logger.error(`获取最新执行日志失败: 任务ID ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 删除任务相关的所有日志
   */
  async deleteLogsByTaskId(taskId: number): Promise<boolean> {
    try {
      const success = await this.scheduledEmailLogMapper.deleteLogsByTaskId(taskId)

      if (success) {
        logger.info(`任务日志删除成功: 任务ID ${taskId}`)
      }

      return success
    } catch (error) {
      logger.error(`删除任务日志失败: 任务ID ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 清理过期日志
   */
  async cleanupExpiredLogs(): Promise<number> {
    try {
      const deletedCount = await this.scheduledEmailLogMapper.cleanupExpiredLogs()

      if (deletedCount > 0) {
        logger.info(`清理过期日志成功: 删除 ${deletedCount} 条记录`)
      }

      return deletedCount
    } catch (error) {
      logger.error(`清理过期日志失败: ${error}`)
      throw error
    }
  }

  /**
   * 获取任务执行成功率统计
   */
  async getTaskSuccessRateStats(
    taskId: number,
    days: number = 30
  ): Promise<Array<{ date: string; successRate: number; totalCount: number; successCount: number }>> {
    try {
      return await this.scheduledEmailLogMapper.getTaskSuccessRateStats(taskId, days)
    } catch (error) {
      logger.error(`获取任务成功率统计失败: 任务ID ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 记录任务执行成功日志
   */
  async logTaskSuccess(
    taskId: number,
    executionTime: string,
    emailMessageId: string,
    executionDuration: number,
    message?: string,
    metadata?: Partial<ScheduledEmailLogDto.CreateLogRequest>
  ): Promise<number> {
    return await this.createExecutionLog({
      taskId,
      executionTime,
      status: 'success',
      message: message || '邮件发送成功',
      emailMessageId,
      executionDuration,
      ...metadata
    })
  }

  /**
   * 记录任务执行失败日志
   */
  async logTaskFailure(
    taskId: number,
    executionTime: string,
    errorDetails: string,
    executionDuration: number,
    message?: string,
    metadata?: Partial<ScheduledEmailLogDto.CreateLogRequest>
  ): Promise<number> {
    return await this.createExecutionLog({
      taskId,
      executionTime,
      status: 'failed',
      message: message || '邮件发送失败',
      errorDetails,
      executionDuration,
      ...metadata
    })
  }

  /**
   * 转换DAO对象为DTO对象
   */
  private convertDaoToDto(dao: ScheduledEmailLogDao.ScheduledEmailLogOptions): ScheduledEmailLogDto.ExecutionLog {
    return {
      id: dao.id,
      taskId: dao.taskId,
      executionTime: dao.executionTime,
      executionTimezone: dao.executionTimezone || undefined,
      status: dao.status,
      message: dao.message,
      errorDetails: dao.errorDetails,
      emailMessageId: dao.emailMessageId,
      senderEmail: dao.senderEmail || undefined,
      senderName: dao.senderName || undefined,
      recipientTo: this.parseStringArray(dao.recipientTo),
      recipientCc: this.parseStringArray(dao.recipientCc),
      recipientBcc: this.parseStringArray(dao.recipientBcc),
      replyTo: dao.replyTo || undefined,
      emailSubject: dao.emailSubject || undefined,
      attachmentCount: dao.attachmentCount,
      attachmentNames: this.parseStringArray(dao.attachmentNames),
      emailChannel: dao.emailChannel || undefined,
      provider: dao.provider || undefined,
      providerResponse: dao.providerResponse || undefined,
      acceptedRecipients: this.parseStringArray(dao.acceptedRecipients),
      rejectedRecipients: this.parseStringArray(dao.rejectedRecipients),
      retryCount: dao.retryCount,
      executionDuration: dao.executionDuration,
      rawRequestPayload: this.parseJson(dao.rawRequestPayload),
      rawResponsePayload: this.parseJson(dao.rawResponsePayload),
      smtpHost: dao.smtpHost || undefined,
      smtpPort: dao.smtpPort || undefined,
      createdTime: dao.createdTime,
      createdTimezone: dao.createdTimezone || undefined
    }
  }

  private parseStringArray(value?: string | string[] | null): string[] | undefined {
    if (!value) {
      return undefined
    }
    if (Array.isArray(value)) {
      return value
    }
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed
      }
      if (typeof parsed === 'string') {
        return [parsed]
      }
    } catch (_error) {
      if (typeof value === 'string') {
        return value
          .split(/[,;]/)
          .map((item) => item.trim())
          .filter(Boolean)
      }
    }
    return undefined
  }

  private parseJson<T = Record<string, any>>(value?: string | Record<string, any> | null): T | undefined {
    if (!value) {
      return undefined
    }
    if (typeof value === 'object') {
      return value as T
    }
    try {
      return JSON.parse(value) as T
    } catch (_error) {
      logger.warn(`解析JSON字段失败: ${value?.toString().slice(0, 100)}`)
      return undefined
    }
  }

  private getCurrentTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }
}
