import { ScheduledEmailLogMapper } from '@/server/mapper/scheduledEmailLogMapper'
import { BaseService } from '@/server/service/baseService'
import dayjs from 'dayjs'

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
  async createExecutionLog(logRequestDto: ScheduledEmailLogDto.CreateLogOptions): Promise<number> {
    try {
      const { createTime, createdBy } = await super.getDefaultInfo()
      const timezone = logRequestDto.executionTimezone || this.getCurrentTimezone()
      const createdTimezone = logRequestDto.createdTimezone || timezone
      const executionDao: ScheduledEmailLogDao.CreateScheduledEmailLogOptions = {
        taskId: logRequestDto.taskId,
        executionTime: logRequestDto.executionTime,
        executionTimezone: timezone,
        status: logRequestDto.status,
        message: logRequestDto.message,
        errorDetails: logRequestDto.errorDetails,
        emailMessageId: logRequestDto.emailMessageId,
        senderEmail: logRequestDto.senderEmail || 'system@unknown',
        senderName: logRequestDto.senderName,
        recipientTo: logRequestDto.recipientTo,
        recipientCc: logRequestDto.recipientCc,
        recipientBcc: logRequestDto.recipientBcc,
        replyTo: logRequestDto.replyTo,
        emailSubject: logRequestDto.emailSubject,
        attachmentCount: logRequestDto.attachmentCount,
        attachmentNames: logRequestDto.attachmentNames,
        emailChannel: logRequestDto.emailChannel,
        provider: logRequestDto.provider,
        providerResponse: logRequestDto.providerResponse,
        acceptedRecipients: logRequestDto.acceptedRecipients,
        rejectedRecipients: logRequestDto.rejectedRecipients,
        retryCount: logRequestDto.retryCount,
        executionDuration: logRequestDto.executionDuration,
        rawRequestPayload: logRequestDto.rawRequestPayload || undefined,
        rawResponsePayload: logRequestDto.rawResponsePayload || undefined,
        smtpHost: logRequestDto.smtpHost,
        smtpPort: logRequestDto.smtpPort || undefined,
        createdTime: createTime,
        createdBy,
        createdTimezone
      }

      const logId = await this.scheduledEmailLogMapper.createScheduledEmailLog(executionDao)

      if (logId > 0) {
        logger.info(`执行日志创建成功: 任务ID ${logRequestDto.taskId}, 日志ID ${logId}, 状态: ${logRequestDto.status}`)
      }

      return logId
    } catch (error) {
      logger.error(`创建执行日志失败: 任务ID ${logRequestDto.taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 根据条件获取单条执行日志
   */
  async getExecutionLog(
    query: ScheduledEmailLogDto.GetExecutionLogOptions
  ): Promise<ScheduledEmailLogVo.ExecutionLog | null> {
    try {
      const logDao = await this.scheduledEmailLogMapper.getScheduledEmailLog(query)
      return logDao ? this.convertDaoToVo(logDao) : null
    } catch (error) {
      logger.error(`获取执行日志失败: ${JSON.stringify(query)}, ${error}`)
      throw error
    }
  }

  /**
   * 获取任务执行日志列表
   */
  async getExecutionLogList(queryDto: ScheduledEmailLogDto.LogListQuery): Promise<ScheduledEmailLogVo.LogListResponse> {
    try {
      const limit = queryDto.limit || 50
      const offset = queryDto.offset || 0

      // 获取日志列表和总数
      const [logDaoList, total] = await Promise.all([
        this.scheduledEmailLogMapper.getScheduledEmailLogList(queryDto),
        this.scheduledEmailLogMapper.getScheduledEmailLogCount(queryDto)
      ])

      return {
        logs: logDaoList.map((logDao) => this.convertDaoToVo(logDao)),
        total,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    } catch (error) {
      logger.error(`获取执行日志列表失败: ${JSON.stringify(queryDto)}, ${error}`)
      throw error
    }
  }

  /**
   * 获取任务的最新执行日志
   */
  async getLatestExecutionLog(taskId: number): Promise<ScheduledEmailLogVo.ExecutionLog | null> {
    try {
      const logDao = await this.scheduledEmailLogMapper.getLatestLogByTaskId(taskId)
      return logDao ? this.convertDaoToVo(logDao) : null
    } catch (error) {
      logger.error(`获取最新执行日志失败: 任务ID ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 根据条件删除执行日志
   */
  async deleteExecutionLogs(
    query: ScheduledEmailLogDto.DeleteExecutionLogOptions
  ): Promise<boolean> {
    try {
      const deletedCount = await this.scheduledEmailLogMapper.deleteLogs(query)

      if (deletedCount > 0) {
        logger.info(`执行日志删除成功: 条件 ${JSON.stringify(query)}, 删除数量 ${deletedCount}`)
      }

      return deletedCount > 0
    } catch (error) {
      logger.error(`删除执行日志失败: ${JSON.stringify(query)}, ${error}`)
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
    query: ScheduledEmailLogDto.TaskSuccessRateQuery
  ): Promise<Array<{ date: string; successRate: number; totalCount: number; successCount: number }>> {
    try {
      return await this.scheduledEmailLogMapper.getTaskSuccessRateStats(query)
    } catch (error) {
      logger.error(`获取任务成功率统计失败: ${JSON.stringify(query)}, ${error}`)
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
    metadata?: Partial<ScheduledEmailLogDto.CreateLogOptions>
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
    metadata?: Partial<ScheduledEmailLogDto.CreateLogOptions>
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
   * 转换DAO对象为VO对象
   */
  private convertDaoToVo(logDao: ScheduledEmailLogDao.ScheduledEmailLogOptions): ScheduledEmailLogVo.ExecutionLog {
    const dtoPayload = this.convertDaoToDto(logDao)
    return {
      ...dtoPayload
    }
  }

  /**
   * DAO -> DTO
   */
  private convertDaoToDto(logDao: ScheduledEmailLogDao.ScheduledEmailLogOptions): ScheduledEmailLogDto.ExecutionLog {
    return {
      id: logDao.id,
      taskId: logDao.taskId,
      executionTime: logDao.executionTime,
      executionTimezone: logDao.executionTimezone || undefined,
      status: logDao.status,
      message: logDao.message,
      errorDetails: logDao.errorDetails,
      emailMessageId: logDao.emailMessageId,
      senderEmail: logDao.senderEmail || undefined,
      senderName: logDao.senderName || undefined,
      recipientTo: this.parseStringArray(logDao.recipientTo),
      recipientCc: this.parseStringArray(logDao.recipientCc),
      recipientBcc: this.parseStringArray(logDao.recipientBcc),
      replyTo: logDao.replyTo || undefined,
      emailSubject: logDao.emailSubject || undefined,
      attachmentCount: logDao.attachmentCount,
      attachmentNames: this.parseStringArray(logDao.attachmentNames),
      emailChannel: logDao.emailChannel || undefined,
      provider: logDao.provider || undefined,
      providerResponse: logDao.providerResponse || undefined,
      acceptedRecipients: this.parseStringArray(logDao.acceptedRecipients),
      rejectedRecipients: this.parseStringArray(logDao.rejectedRecipients),
      retryCount: logDao.retryCount,
      executionDuration: logDao.executionDuration,
      rawRequestPayload: this.parseJson(logDao.rawRequestPayload),
      rawResponsePayload: this.parseJson(logDao.rawResponsePayload),
      smtpHost: logDao.smtpHost || undefined,
      smtpPort: logDao.smtpPort || undefined,
      createdTime: logDao.createdTime,
      createdTimezone: logDao.createdTimezone || undefined
    }
  }

  /**
   * DTO -> DAO
   */
  private convertDtoToDao(
    logDto: ScheduledEmailLogDto.ExecutionLog,
    extras?: { createdBy?: string }
  ): ScheduledEmailLogDao.ScheduledEmailLogOptions {
    return {
      id: logDto.id,
      taskId: logDto.taskId,
      executionTime: logDto.executionTime,
      executionTimezone: logDto.executionTimezone || undefined,
      status: logDto.status,
      message: logDto.message,
      errorDetails: logDto.errorDetails,
      emailMessageId: logDto.emailMessageId,
      senderEmail: logDto.senderEmail || 'system@unknown',
      senderName: logDto.senderName,
      recipientTo: this.stringifyStringArray(logDto.recipientTo),
      recipientCc: this.stringifyStringArray(logDto.recipientCc),
      recipientBcc: this.stringifyStringArray(logDto.recipientBcc),
      replyTo: logDto.replyTo ?? undefined,
      emailSubject: logDto.emailSubject ?? undefined,
      attachmentCount: logDto.attachmentCount,
      attachmentNames: this.stringifyStringArray(logDto.attachmentNames),
      emailChannel: logDto.emailChannel ?? undefined,
      provider: logDto.provider ?? undefined,
      providerResponse: logDto.providerResponse ?? undefined,
      acceptedRecipients: this.stringifyStringArray(logDto.acceptedRecipients),
      rejectedRecipients: this.stringifyStringArray(logDto.rejectedRecipients),
      retryCount: logDto.retryCount ?? 0,
      rawRequestPayload: logDto.rawRequestPayload ? JSON.stringify(logDto.rawRequestPayload) : undefined,
      rawResponsePayload: logDto.rawResponsePayload ? JSON.stringify(logDto.rawResponsePayload) : undefined,
      smtpHost: logDto.smtpHost ?? undefined,
      smtpPort: logDto.smtpPort ?? undefined,
      executionDuration: logDto.executionDuration,
      createdTime: logDto.createdTime,
      createdTimezone: logDto.createdTimezone ?? undefined,
      createdBy: extras?.createdBy || 'system'
    }
  }

  private stringifyStringArray(value?: string[] | undefined): string | undefined {
    if (!value || value.length === 0) {
      return undefined
    }
    return JSON.stringify(value)
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

  /**
   * 即时发送成功日志
   */
  async logManualSendSuccess(
    sendResult: SendEmailVo.SendEmailResponse,
    sendRequest: SendEmailDto.SendChartEmailRequest
  ): Promise<void> {
    const executionTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const metadata = this.buildManualSendMetadata(sendRequest, sendResult)
    await this.logTaskSuccess(
      0,
      executionTime,
      sendResult.messageId,
      typeof sendResult.messageTime === 'number' ? sendResult.messageTime : 0,
      '即时邮件发送成功',
      metadata
    )
  }

  /**
   * 即时发送失败日志
   */
  async logManualSendFailure(sendRequest: SendEmailDto.SendChartEmailRequest, errorMessage: string): Promise<void> {
    const executionTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const metadata = this.buildManualSendMetadata(sendRequest)
    await this.logTaskFailure(0, executionTime, errorMessage, 0, '即时邮件发送失败', metadata)
  }

  private buildManualSendMetadata(
    sendRequest: SendEmailDto.SendChartEmailRequest,
    sendResult?: SendEmailVo.SendEmailResponse
  ): Partial<ScheduledEmailLogDto.CreateLogOptions> {
    const recipients = Array.isArray(sendRequest.emailConfig.to)
      ? sendRequest.emailConfig.to
      : sendRequest.emailConfig.to
          .split(/[,;]/)
          .map((item) => item.trim())
          .filter(Boolean)
    const attachmentNames = sendResult?.attachments
      ?.map((attachment) => attachment.filename)
      .filter((filename): filename is string => Boolean(filename))
    return {
      senderEmail: sendResult?.sender || this.getSenderAddressFallback(),
      recipientTo: recipients,
      emailSubject: sendRequest.emailConfig.subject,
      attachmentNames: attachmentNames && attachmentNames.length > 0 ? attachmentNames : undefined,
      attachmentCount: attachmentNames?.length || undefined,
      emailChannel: sendResult?.channel,
      provider: sendResult?.transport?.host,
      providerResponse: sendResult?.response,
      acceptedRecipients: sendResult?.accepted ? this.flattenNodemailerRecipients(sendResult.accepted) : undefined,
      rejectedRecipients: sendResult?.rejected ? this.flattenNodemailerRecipients(sendResult.rejected) : undefined,
      rawRequestPayload: sendRequest,
      rawResponsePayload: sendResult,
      smtpHost: sendResult?.transport?.host,
      smtpPort: sendResult?.transport?.port
    }
  }

  private getSenderAddressFallback(): string {
    return 'system@unknown'
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
}
