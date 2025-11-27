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
  async createExecutionLog(logOptions: ScheduledEmailLogDto.CreateLogOptions): Promise<number> {
    try {
      const { createTime, createdBy } = await super.getDefaultInfo()
      const timezone = logOptions.executionTimezone || this.getCurrentTimezone()
      const createdTimezone = logOptions.createdTimezone || timezone
      const executionDao: ScheduledEmailLogDao.CreateScheduledEmailLogOptions = {
        taskId: logOptions.taskId,
        executionTime: logOptions.executionTime,
        executionTimezone: timezone,
        status: logOptions.status,
        message: logOptions.message,
        errorDetails: logOptions.errorDetails,
        emailMessageId: logOptions.emailMessageId,
        senderEmail: logOptions.senderEmail || 'system@unknown',
        senderName: logOptions.senderName,
        recipientTo: logOptions.recipientTo,
        recipientCc: logOptions.recipientCc,
        recipientBcc: logOptions.recipientBcc,
        replyTo: logOptions.replyTo,
        emailSubject: logOptions.emailSubject,
        attachmentCount: logOptions.attachmentCount,
        attachmentNames: logOptions.attachmentNames,
        emailChannel: logOptions.emailChannel,
        provider: logOptions.provider,
        providerResponse: logOptions.providerResponse,
        acceptedRecipients: logOptions.acceptedRecipients,
        rejectedRecipients: logOptions.rejectedRecipients,
        retryCount: logOptions.retryCount,
        executionDuration: logOptions.executionDuration,
        rawRequestPayload: logOptions.rawRequestPayload || undefined,
        rawResponsePayload: logOptions.rawResponsePayload || undefined,
        smtpHost: logOptions.smtpHost,
        smtpPort: logOptions.smtpPort || undefined,
        createdTime: createTime,
        createdBy,
        createdTimezone
      }

      const logId = await this.scheduledEmailLogMapper.createScheduledEmailLog(executionDao)

      if (logId > 0) {
        logger.info(`执行日志创建成功: 任务ID ${logOptions.taskId}, 日志ID ${logId}, 状态: ${logOptions.status}`)
      }

      return logId
    } catch (error) {
      logger.error(`创建执行日志失败: 任务ID ${logOptions.taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 根据条件获取单条执行日志
   */
  async getExecutionLog(
    queryOptions: ScheduledEmailLogDto.GetExecutionLogOptions
  ): Promise<ScheduledEmailLogVo.ExecutionLog | null> {
    try {
      const logRecord = await this.scheduledEmailLogMapper.getScheduledEmailLog(queryOptions)
      return logRecord ? this.convertDaoToVo(logRecord) : null
    } catch (error) {
      logger.error(`获取执行日志失败: ${JSON.stringify(queryOptions)}, ${error}`)
      throw error
    }
  }

  /**
   * 获取任务执行日志列表
   */
  async getExecutionLogList(
    listQuery: ScheduledEmailLogDto.LogListQuery
  ): Promise<ScheduledEmailLogVo.LogListResponse> {
    try {
      const limit = listQuery.limit || 50
      const offset = listQuery.offset || 0

      // 获取日志列表和总数
      const [logDaoList, total] = await Promise.all([
        this.scheduledEmailLogMapper.getScheduledEmailLogList(listQuery),
        this.scheduledEmailLogMapper.getScheduledEmailLogCount(listQuery)
      ])

      return {
        logs: logDaoList.map((logRecord) => this.convertDaoToVo(logRecord)),
        total,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    } catch (error) {
      logger.error(`获取执行日志列表失败: ${JSON.stringify(listQuery)}, ${error}`)
      throw error
    }
  }

  /**
   * 获取任务的最新执行日志
   */
  async getLatestExecutionLog(taskId: number): Promise<ScheduledEmailLogVo.ExecutionLog | null> {
    try {
      const logRecord = await this.scheduledEmailLogMapper.getLatestLogByTaskId(taskId)
      return logRecord ? this.convertDaoToVo(logRecord) : null
    } catch (error) {
      logger.error(`获取最新执行日志失败: 任务ID ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 根据条件删除执行日志
   */
  async deleteExecutionLogs(deleteCriteria: ScheduledEmailLogDto.DeleteExecutionLogOptions): Promise<boolean> {
    try {
      const deletedCount = await this.scheduledEmailLogMapper.deleteLogs(deleteCriteria)

      if (deletedCount > 0) {
        logger.info(`执行日志删除成功: 条件 ${JSON.stringify(deleteCriteria)}, 删除数量 ${deletedCount}`)
      }

      return deletedCount > 0
    } catch (error) {
      logger.error(`删除执行日志失败: ${JSON.stringify(deleteCriteria)}, ${error}`)
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
    statsQuery: ScheduledEmailLogDto.TaskSuccessRateQuery
  ): Promise<Array<{ date: string; successRate: number; totalCount: number; successCount: number }>> {
    try {
      return await this.scheduledEmailLogMapper.getTaskSuccessRateStats(statsQuery)
    } catch (error) {
      logger.error(`获取任务成功率统计失败: ${JSON.stringify(statsQuery)}, ${error}`)
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
  private convertDaoToVo(logRecord: ScheduledEmailLogDao.ScheduledEmailLogOptions): ScheduledEmailLogVo.ExecutionLog {
    const dtoPayload = this.convertDaoToDto(logRecord)
    return {
      ...dtoPayload
    }
  }

  /**
   * DAO -> DTO
   */
  private convertDaoToDto(logRecord: ScheduledEmailLogDao.ScheduledEmailLogOptions): ScheduledEmailLogDto.ExecutionLog {
    return {
      id: logRecord.id,
      taskId: logRecord.taskId,
      executionTime: logRecord.executionTime,
      executionTimezone: logRecord.executionTimezone || undefined,
      status: logRecord.status,
      message: logRecord.message,
      errorDetails: logRecord.errorDetails,
      emailMessageId: logRecord.emailMessageId,
      senderEmail: logRecord.senderEmail || undefined,
      senderName: logRecord.senderName || undefined,
      recipientTo: this.parseStringArray(logRecord.recipientTo),
      recipientCc: this.parseStringArray(logRecord.recipientCc),
      recipientBcc: this.parseStringArray(logRecord.recipientBcc),
      replyTo: logRecord.replyTo || undefined,
      emailSubject: logRecord.emailSubject || undefined,
      attachmentCount: logRecord.attachmentCount,
      attachmentNames: this.parseStringArray(logRecord.attachmentNames),
      emailChannel: logRecord.emailChannel || undefined,
      provider: logRecord.provider || undefined,
      providerResponse: logRecord.providerResponse || undefined,
      acceptedRecipients: this.parseStringArray(logRecord.acceptedRecipients),
      rejectedRecipients: this.parseStringArray(logRecord.rejectedRecipients),
      retryCount: logRecord.retryCount,
      executionDuration: logRecord.executionDuration,
      rawRequestPayload: this.parseJson(logRecord.rawRequestPayload),
      rawResponsePayload: this.parseJson(logRecord.rawResponsePayload),
      smtpHost: logRecord.smtpHost || undefined,
      smtpPort: logRecord.smtpPort || undefined,
      createdTime: logRecord.createdTime,
      createdTimezone: logRecord.createdTimezone || undefined
    }
  }

  /**
   * DTO -> DAO
   */
  private convertDtoToDao(
    logData: ScheduledEmailLogDto.ExecutionLog,
    additionalOptions?: { createdBy?: string }
  ): ScheduledEmailLogDao.ScheduledEmailLogOptions {
    return {
      id: logData.id,
      taskId: logData.taskId,
      executionTime: logData.executionTime,
      executionTimezone: logData.executionTimezone || undefined,
      status: logData.status,
      message: logData.message,
      errorDetails: logData.errorDetails,
      emailMessageId: logData.emailMessageId,
      senderEmail: logData.senderEmail || 'system@unknown',
      senderName: logData.senderName,
      recipientTo: this.stringifyStringArray(logData.recipientTo),
      recipientCc: this.stringifyStringArray(logData.recipientCc),
      recipientBcc: this.stringifyStringArray(logData.recipientBcc),
      replyTo: logData.replyTo ?? undefined,
      emailSubject: logData.emailSubject ?? undefined,
      attachmentCount: logData.attachmentCount,
      attachmentNames: this.stringifyStringArray(logData.attachmentNames),
      emailChannel: logData.emailChannel ?? undefined,
      provider: logData.provider ?? undefined,
      providerResponse: logData.providerResponse ?? undefined,
      acceptedRecipients: this.stringifyStringArray(logData.acceptedRecipients),
      rejectedRecipients: this.stringifyStringArray(logData.rejectedRecipients),
      retryCount: logData.retryCount ?? 0,
      rawRequestPayload: logData.rawRequestPayload ? JSON.stringify(logData.rawRequestPayload) : undefined,
      rawResponsePayload: logData.rawResponsePayload ? JSON.stringify(logData.rawResponsePayload) : undefined,
      smtpHost: logData.smtpHost ?? undefined,
      smtpPort: logData.smtpPort ?? undefined,
      executionDuration: logData.executionDuration,
      createdTime: logData.createdTime,
      createdTimezone: logData.createdTimezone ?? undefined,
      createdBy: additionalOptions?.createdBy || 'system'
    }
  }

  private stringifyStringArray(stringArray?: string[] | undefined): string | undefined {
    if (!stringArray || stringArray.length === 0) {
      return undefined
    }
    return JSON.stringify(stringArray)
  }

  private parseStringArray(rawValue?: string | string[] | null): string[] | undefined {
    if (!rawValue) {
      return undefined
    }
    if (Array.isArray(rawValue)) {
      return rawValue
    }
    try {
      const parsed = JSON.parse(rawValue)
      if (Array.isArray(parsed)) {
        return parsed
      }
      if (typeof parsed === 'string') {
        return [parsed]
      }
    } catch (_error) {
      if (typeof rawValue === 'string') {
        return rawValue
          .split(/[,;]/)
          .map((item) => item.trim())
          .filter(Boolean)
      }
    }
    return undefined
  }

  private parseJson<T = Record<string, any>>(jsonString?: string | Record<string, any> | null): T | undefined {
    if (!jsonString) {
      return undefined
    }
    if (typeof jsonString === 'object') {
      return jsonString as T
    }
    try {
      return JSON.parse(jsonString) as T
    } catch (_error) {
      logger.warn(`解析JSON字段失败: ${jsonString?.toString().slice(0, 100)}`)
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
    sendRequest: SendEmailDto.SendChartEmailOptions
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
  async logManualSendFailure(sendRequest: SendEmailDto.SendChartEmailOptions, errorMessage: string): Promise<void> {
    const executionTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const metadata = this.buildManualSendMetadata(sendRequest)
    await this.logTaskFailure(0, executionTime, errorMessage, 0, '即时邮件发送失败', metadata)
  }

  private buildManualSendMetadata(
    sendRequest: SendEmailDto.SendChartEmailOptions,
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
