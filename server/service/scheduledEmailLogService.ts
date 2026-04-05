import { ScheduledEmailLogMapper } from '@/server/mapper/scheduledEmailLogMapper'
import { BaseService } from '@/server/service/baseService'
import { SendEmailService } from '@/server/service/sendEmailService'
import dayjs from 'dayjs'

const logger = new Logger({ fileName: 'scheduled-email-log', folderName: 'server' })

/**
 * 定时邮件日志服务
 */
export class ScheduledEmailLogService extends BaseService {
  /**
   * 定时邮件日志Mapper
   */
  private scheduledEmailLogMapper: ScheduledEmailLogMapper
  /**
   * 邮件发送服务
   */
  private sendEmailService: SendEmailService

  constructor() {
    super()
    this.scheduledEmailLogMapper = new ScheduledEmailLogMapper()
    this.sendEmailService = new SendEmailService()
  }

  /**
   * 创建执行日志
   */
  async createExecutionLog(logOptions: ScheduledEmailLogDto.CreateScheduledEmailLogOptions): Promise<number> {
    try {
      const { createTime, createdBy } = await super.getDefaultInfo()
      const timezone = logOptions.executionTimezone || this.getCurrentTimezone()

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
        createdBy: createdBy || 'system'
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
  ): Promise<ScheduledEmailLogVo.ScheduledEmailLogOptions | null> {
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
  async getExecutionLogList(listQuery: ScheduledEmailLogDto.LogListQuery): Promise<ScheduledEmailLogVo.LogListOptions> {
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
  async getLatestExecutionLog(taskId: number): Promise<ScheduledEmailLogVo.ScheduledEmailLogOptions | null> {
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
    metadata?: Partial<ScheduledEmailLogDto.CreateScheduledEmailLogOptions>
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
    metadata?: Partial<ScheduledEmailLogDto.CreateScheduledEmailLogOptions>
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
  private convertDaoToVo(
    logRecord: ScheduledEmailLogDao.ScheduledEmailLogOptions
  ): ScheduledEmailLogVo.ScheduledEmailLogOptions {
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

      createdBy: logRecord.createdBy
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

      createdBy: additionalOptions?.createdBy || 'system'
    }
  }

  private stringifyStringArray(value?: string | string[] | null): string | undefined {
    if (!value) {
      return undefined
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? JSON.stringify(value) : undefined
    }
    return value
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
    sendResult: SendEmailVo.SendEmailOptions,
    sendRequest: SendEmailDto.SendEmailOptions
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
  async logManualSendFailure(sendRequest: SendEmailDto.SendEmailOptions, errorMessage: string): Promise<void> {
    const executionTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const metadata = this.buildManualSendMetadata(sendRequest)
    await this.logTaskFailure(0, executionTime, errorMessage, 0, '即时邮件发送失败', metadata)
  }

  public buildTaskBaseMetadata(
    emailConfig: {
      to: string | string[]
      subject: string
      additionalContent?: string
    },
    analyzeOptions: SendEmailDto.AnalyzeOption,
    retryCount: number
  ): Partial<ScheduledEmailLogDto.CreateLogOptions> {
    const recipients = this.normalizeRecipients(emailConfig.to)
    const attachments = analyzeOptions.filename ? [analyzeOptions.filename] : []
    const transport = this.sendEmailService.getTransportInfo()

    return {
      senderEmail: this.sendEmailService.getSenderAddress(),
      recipientTo: recipients.length > 0 ? recipients : undefined,
      emailSubject: emailConfig.subject,
      attachmentNames: attachments.length > 0 ? attachments : undefined,
      attachmentCount: attachments.length || undefined,
      emailChannel: this.sendEmailService.getChannel(),
      provider: transport.host || 'nodemailer',
      retryCount,
      executionTimezone: this.getCurrentTimezone(),
      rawRequestPayload: {
        emailConfig,
        analyzeOptions
      },
      smtpHost: transport.host,
      smtpPort: transport.port
    }
  }

  public enrichSendResultMetadata(
    baseMetadata: Partial<ScheduledEmailLogDto.CreateLogOptions>,
    sendResult: SendEmailVo.SendEmailOptions
  ): Partial<ScheduledEmailLogDto.CreateLogOptions> {
    const attachmentNames = sendResult.attachments
      ?.map((item) => item.filename)
      .filter((item): item is string => Boolean(item))
    const acceptedRecipients = this.flattenNodemailerRecipients(sendResult.accepted)
    const rejectedRecipients = this.flattenNodemailerRecipients(sendResult.rejected)
    const envelopeRecipients =
      sendResult.envelope?.to && sendResult.envelope.to.length > 0 ? sendResult.envelope.to : undefined

    return {
      ...baseMetadata,
      senderEmail: sendResult.sender || baseMetadata.senderEmail,
      recipientTo: envelopeRecipients || baseMetadata.recipientTo,
      attachmentNames: attachmentNames && attachmentNames.length > 0 ? attachmentNames : baseMetadata.attachmentNames,
      attachmentCount:
        typeof sendResult.attachments?.length !== 'undefined'
          ? sendResult.attachments.length
          : baseMetadata.attachmentCount,
      emailChannel: sendResult.channel || baseMetadata.emailChannel,
      provider: sendResult.transport?.host || baseMetadata.provider || 'nodemailer',
      providerResponse: sendResult.response || baseMetadata.providerResponse,
      acceptedRecipients: acceptedRecipients || baseMetadata.acceptedRecipients,
      rejectedRecipients: rejectedRecipients || baseMetadata.rejectedRecipients,
      rawResponsePayload: sendResult,
      smtpHost: sendResult.transport?.host || baseMetadata.smtpHost,
      smtpPort: sendResult.transport?.port || baseMetadata.smtpPort
    }
  }

  private buildManualSendMetadata(
    sendRequest: SendEmailDto.SendEmailOptions,
    sendResult?: SendEmailVo.SendEmailOptions
  ): Partial<ScheduledEmailLogDto.CreateScheduledEmailLogOptions> {
    const attachmentNames = sendResult?.attachments
      ?.map((attachment) => attachment.filename)
      .filter((filename): filename is string => Boolean(filename))
    const fallbackAttachmentNames = sendRequest.analyzeOptions.filename
      ? [sendRequest.analyzeOptions.filename]
      : undefined
    const transportHost = sendResult?.transport?.host || this.sendEmailService.getTransportInfo().host || undefined
    const transportPort = sendResult?.transport?.port || this.sendEmailService.getTransportInfo().port || undefined

    return {
      senderEmail: sendResult?.sender || this.sendEmailService.getSenderAddress(),
      recipientTo: this.normalizeRecipients(sendRequest.emailConfig.to),
      emailSubject: sendRequest.emailConfig.subject,
      attachmentNames: attachmentNames && attachmentNames.length > 0 ? attachmentNames : fallbackAttachmentNames,
      attachmentCount: attachmentNames?.length || fallbackAttachmentNames?.length || undefined,
      emailChannel: sendResult?.channel || this.sendEmailService.getChannel(),
      provider: transportHost,
      providerResponse: sendResult?.response,
      acceptedRecipients: sendResult?.accepted ? this.flattenNodemailerRecipients(sendResult.accepted) : undefined,
      rejectedRecipients: sendResult?.rejected ? this.flattenNodemailerRecipients(sendResult.rejected) : undefined,
      rawRequestPayload: sendRequest,
      rawResponsePayload: sendResult,
      smtpHost: transportHost,
      smtpPort: transportPort
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
}
