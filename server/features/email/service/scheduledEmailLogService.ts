import { BaseService } from '@/server/service/baseService'
import { resolveMailerProfile, type MailerProfile } from '../domain/mailerProfile'
import { ScheduledEmailLogMapper } from '../mapper/scheduledEmailLogMapper'
import dayjs from 'dayjs'

/**
 * 定时邮件执行日志服务日志记录器
 * @type {Logger}
 */
const logger = new Logger({ fileName: 'scheduled-email-log', folderName: 'server' })

/**
 * 定时邮件日志服务类，提供执行日志的创建、查询、清理、以及格式转换等业务逻辑
 * @extends {BaseService}
 */
export class ScheduledEmailLogService extends BaseService {
  /**
   * 定时邮件日志数据访问对象 (Mapper)
   * @type {ScheduledEmailLogMapper}
   * @private
   */
  private scheduledEmailLogMapper: ScheduledEmailLogMapper
  /**
   * 发件人画像配置（用于写日志时记录 sender、channel、host、port 等环境配置信息）
   * @type {MailerProfile}
   * @private
   */
  private mailerProfile: MailerProfile

  /**
   * 构造并初始化定时邮件日志服务，获取 Mapper 实例和解析邮件配置画像
   */
  constructor() {
    super()
    this.scheduledEmailLogMapper = new ScheduledEmailLogMapper()
    this.mailerProfile = resolveMailerProfile()
  }

  /**
   * 创建定时任务的执行日志记录
   * @param {ScheduledEmailLogDto.CreateExecutionLogRequest} createExecutionLogRequest 创建执行日志的请求参数
   * @returns {Promise<number>} 创建成功的日志 ID，如果失败则返回 0
   * @throws {Error} 创建过程中产生错误时抛出异常
   */
  async createExecutionLog(createExecutionLogRequest: ScheduledEmailLogDto.CreateExecutionLogRequest): Promise<number> {
    try {
      const { createTime, createdBy } = await super.getDefaultInfo()
      const timezone = createExecutionLogRequest.executionTimezone || this.getCurrentTimezone()

      const createScheduledEmailLogParams: ScheduledEmailLogDao.CreateScheduledEmailLogParams = {
        taskId: createExecutionLogRequest.taskId,
        executionTime: createExecutionLogRequest.executionTime,
        executionTimezone: timezone,
        status: createExecutionLogRequest.status,
        message: createExecutionLogRequest.message,
        errorDetails: createExecutionLogRequest.errorDetails,
        emailMessageId: createExecutionLogRequest.emailMessageId,
        senderEmail: createExecutionLogRequest.senderEmail || 'system@unknown',
        senderName: createExecutionLogRequest.senderName,
        recipientTo: createExecutionLogRequest.recipientTo,
        recipientCc: createExecutionLogRequest.recipientCc,
        recipientBcc: createExecutionLogRequest.recipientBcc,
        replyTo: createExecutionLogRequest.replyTo,
        emailSubject: createExecutionLogRequest.emailSubject,
        attachmentCount: createExecutionLogRequest.attachmentCount,
        attachmentNames: createExecutionLogRequest.attachmentNames,
        emailChannel: createExecutionLogRequest.emailChannel,
        provider: createExecutionLogRequest.provider,
        providerResponse: createExecutionLogRequest.providerResponse,
        acceptedRecipients: createExecutionLogRequest.acceptedRecipients,
        rejectedRecipients: createExecutionLogRequest.rejectedRecipients,
        retryCount: createExecutionLogRequest.retryCount,
        executionDuration: createExecutionLogRequest.executionDuration,
        rawRequestPayload: createExecutionLogRequest.rawRequestPayload || undefined,
        rawResponsePayload: createExecutionLogRequest.rawResponsePayload || undefined,
        smtpHost: createExecutionLogRequest.smtpHost,
        smtpPort: createExecutionLogRequest.smtpPort || undefined,
        createdTime: createTime,
        createdBy: createdBy || 'system'
      }

      const logId = await this.scheduledEmailLogMapper.createScheduledEmailLog(createScheduledEmailLogParams)

      if (logId > 0) {
        logger.info(
          `执行日志创建成功: 任务ID ${createExecutionLogRequest.taskId}, 日志ID ${logId}, 状态: ${createExecutionLogRequest.status}`
        )
      }

      return logId
    } catch (error) {
      logger.error(`创建执行日志失败: 任务ID ${createExecutionLogRequest.taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 根据指定条件获取单条任务执行日志
   * @param {ScheduledEmailLogDto.GetExecutionLogRequest} queryOptions 获取单条日志的请求过滤参数
   * @returns {Promise<ScheduledEmailLogVo.ExecutionLogResponse | null>} 匹配的执行日志 VO，若不存在则返回 null
   * @throws {Error} 获取日志产生错误时抛出异常
   */
  async getExecutionLog(
    queryOptions: ScheduledEmailLogDto.GetExecutionLogRequest
  ): Promise<ScheduledEmailLogVo.ExecutionLogResponse | null> {
    try {
      const logRecord = await this.scheduledEmailLogMapper.getScheduledEmailLog(queryOptions)
      return logRecord ? this.convertDaoToVo(logRecord) : null
    } catch (error) {
      logger.error(`获取执行日志失败: ${JSON.stringify(queryOptions)}, ${error}`)
      throw error
    }
  }

  /**
   * 获取任务执行日志的分页列表
   * @param {ScheduledEmailLogDto.LogListRequest} listQuery 日志列表查询及分页条件
   * @returns {Promise<ScheduledEmailLogVo.LogListResponse>} 包含日志列表及分页信息的响应对象
   * @throws {Error} 获取日志列表产生错误时抛出异常
   */
  async getExecutionLogList(
    listQuery: ScheduledEmailLogDto.LogListRequest
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
   * 获取指定任务的最新一条执行日志记录
   * @param {number} taskId 任务 ID
   * @returns {Promise<ScheduledEmailLogVo.ExecutionLogResponse | null>} 最新日志记录，若无记录则返回 null
   * @throws {Error} 获取最新日志产生错误时抛出异常
   */
  async getLatestExecutionLog(taskId: number): Promise<ScheduledEmailLogVo.ExecutionLogResponse | null> {
    try {
      const logRecord = await this.scheduledEmailLogMapper.getLatestLogByTaskId(taskId)
      return logRecord ? this.convertDaoToVo(logRecord) : null
    } catch (error) {
      logger.error(`获取最新执行日志失败: 任务ID ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 根据条件批量删除执行日志
   * @param {ScheduledEmailLogDto.DeleteExecutionLogRequest} deleteCriteria 删除过滤条件
   * @returns {Promise<boolean>} 是否成功删除记录
   * @throws {Error} 删除日志时产生异常
   */
  async deleteExecutionLogs(deleteCriteria: ScheduledEmailLogDto.DeleteExecutionLogRequest): Promise<boolean> {
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
   * 清理过期执行日志（默认只保留最近 30 天）
   * @returns {Promise<number>} 成功清理的日志记录条数
   * @throws {Error} 清理过期日志产生错误时抛出异常
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
   * 获取指定日期区间及任务过滤条件下的任务执行成功率统计数据
   * @param {ScheduledEmailLogDto.TaskSuccessRateRequest} statsQuery 成功率统计查询参数
   * @returns {Promise<Array<{ date: string; successRate: number; totalCount: number; successCount: number }>>} 按天统计成功率的数组
   * @throws {Error} 统计产生异常
   */
  async getTaskSuccessRateStats(
    statsQuery: ScheduledEmailLogDto.TaskSuccessRateRequest
  ): Promise<Array<{ date: string; successRate: number; totalCount: number; successCount: number }>> {
    try {
      return await this.scheduledEmailLogMapper.getTaskSuccessRateStats(statsQuery)
    } catch (error) {
      logger.error(`获取任务成功率统计失败: ${JSON.stringify(statsQuery)}, ${error}`)
      throw error
    }
  }

  /**
   * 记录任务执行成功的便捷方法
   * @param {number} taskId 定时邮件任务 ID
   * @param {string} executionTime 任务执行时刻 (YYYY-MM-DD HH:mm:ss)
   * @param {string} emailMessageId 邮件成功投递的 Message-ID
   * @param {number} executionDuration 执行持续总时长 (毫秒)
   * @param {string} [message] 可选的成功说明信息
   * @param {Partial<ScheduledEmailLogDto.CreateExecutionLogRequest>} [metadata] 其它可覆盖的日志元数据字段
   * @returns {Promise<number>} 新增的日志主键 ID
   */
  async logTaskSuccess(
    taskId: number,
    executionTime: string,
    emailMessageId: string,
    executionDuration: number,
    message?: string,
    metadata?: Partial<ScheduledEmailLogDto.CreateExecutionLogRequest>
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
   * 记录任务执行失败的便捷方法
   * @param {number} taskId 定时邮件任务 ID
   * @param {string} executionTime 任务执行时刻 (YYYY-MM-DD HH:mm:ss)
   * @param {string} errorDetails 错误异常细节堆栈或详细描述
   * @param {number} executionDuration 执行持续总时长 (毫秒)
   * @param {string} [message] 可选的失败摘要信息
   * @param {Partial<ScheduledEmailLogDto.CreateExecutionLogRequest>} [metadata] 其它可覆盖的日志元数据字段
   * @returns {Promise<number>} 新增的日志主键 ID
   */
  async logTaskFailure(
    taskId: number,
    executionTime: string,
    errorDetails: string,
    executionDuration: number,
    message?: string,
    metadata?: Partial<ScheduledEmailLogDto.CreateExecutionLogRequest>
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
   * 将数据库层面的日志 DAO 记录转换为前端接口返回的 VO 响应实体
   * @param {ScheduledEmailLogDao.ScheduledEmailLogRecord} logRecord 数据库日志记录
   * @returns {ScheduledEmailLogVo.ExecutionLogResponse} VO 转换响应实体
   * @private
   */
  private convertDaoToVo(
    logRecord: ScheduledEmailLogDao.ScheduledEmailLogRecord
  ): ScheduledEmailLogVo.ExecutionLogResponse {
    return this.convertRecordToItem(logRecord)
  }

  /**
   * 将 DAO 记录详细属性解析为 VO 明细属性（包括 JSON 及字符串数组的反序列化）
   * @param {ScheduledEmailLogDao.ScheduledEmailLogRecord} logRecord 数据库日志记录
   * @returns {ScheduledEmailLogVo.ExecutionLogItem} 解析转换后的 VO 数据明细对象
   * @private
   */
  private convertRecordToItem(
    logRecord: ScheduledEmailLogDao.ScheduledEmailLogRecord
  ): ScheduledEmailLogVo.ExecutionLogItem {
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
   * 将字符串数组序列化为以 JSON/文本方式存储的数据库字段
   * @param {string | string[] | null} [value] 原始值或数组
   * @returns {string | undefined} 序列化后的字符串；若无效则返回 undefined
   * @private
   */
  private stringifyStringArray(value?: string | string[] | null): string | undefined {
    if (!value) {
      return undefined
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? JSON.stringify(value) : undefined
    }
    return value
  }

  /**
   * 将数据库中的收件人等字符串字段反序列化为数组结构
   * @param {string | string[] | null} [rawValue] 待解析的数据库内容
   * @returns {string[] | undefined} 解析后的字符串数组
   * @private
   */
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

  /**
   * 安全地解析 JSON 字符串
   * @template T
   * @param {string | Record<string, any> | null} [jsonString] JSON 字符串或已经解析的对象
   * @returns {T | undefined} 解析后的泛型对象
   * @private
   */
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

  /**
   * 获取当前运行环境的时区，默认返回 'UTC'
   * @returns {string} 时区标识符（如 'Asia/Shanghai'）
   * @private
   */
  private getCurrentTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }

  /**
   * 记录即时/手动发送邮件成功的日志
   * @param {SendEmailVo.SendEmailResponse} sendResult 发送成功的响应结果
   * @param {SendEmailDto.SendChartEmailRequest} sendRequest 手动发送邮件的原始请求包
   * @returns {Promise<void>}
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
   * 记录即时/手动发送邮件失败的日志
   * @param {SendEmailDto.SendChartEmailRequest} sendRequest 手动发送邮件的原始请求包
   * @param {string} errorMessage 投递失败的错误说明信息
   * @returns {Promise<void>}
   */
  async logManualSendFailure(sendRequest: SendEmailDto.SendChartEmailRequest, errorMessage: string): Promise<void> {
    const executionTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const metadata = this.buildManualSendMetadata(sendRequest)
    await this.logTaskFailure(0, executionTime, errorMessage, 0, '即时邮件发送失败', metadata)
  }

  /**
   * 构建定时邮件任务的基础日志元数据 (获取发件人画像、主题、通道等)
   * @param {object} emailConfig 邮件主题及收件人配置
   * @param {string | string[]} emailConfig.to 收件人列表
   * @param {string} emailConfig.subject 邮件主题
   * @param {SendEmailDto.AnalyzePayload} analyzeOptions 分析快照图表配置
   * @param {number} retryCount 重试次数
   * @returns {Partial<ScheduledEmailLogDto.CreateExecutionLogPayload>} 日志的通用基础元数据对象
   */
  public buildTaskBaseMetadata(
    emailConfig: {
      to: string | string[]
      subject: string
      additionalContent?: string
    },
    analyzeOptions: SendEmailDto.AnalyzePayload,
    retryCount: number
  ): Partial<ScheduledEmailLogDto.CreateExecutionLogPayload> {
    const recipients = this.normalizeRecipients(emailConfig.to)
    const attachments = analyzeOptions.filename ? [analyzeOptions.filename] : []
    const { transport, senderAddress, channel } = this.mailerProfile

    return {
      senderEmail: senderAddress,
      recipientTo: recipients.length > 0 ? recipients : undefined,
      emailSubject: emailConfig.subject,
      attachmentNames: attachments.length > 0 ? attachments : undefined,
      attachmentCount: attachments.length || undefined,
      emailChannel: channel,
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

  /**
   * 使用实际邮件投递的结果来丰富并补全基础日志元数据 (添加服务商原始响应、实际接收与拒收的列表等)
   * @param {Partial<ScheduledEmailLogDto.CreateExecutionLogPayload>} baseMetadata 基础元数据
   * @param {SendEmailVo.SendEmailResponse} sendResult 邮件发送的响应结果
   * @returns {Partial<ScheduledEmailLogDto.CreateExecutionLogPayload>} 填充完善后的日志元数据
   */
  public enrichSendResultMetadata(
    baseMetadata: Partial<ScheduledEmailLogDto.CreateExecutionLogPayload>,
    sendResult: SendEmailVo.SendEmailResponse
  ): Partial<ScheduledEmailLogDto.CreateExecutionLogPayload> {
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

  /**
   * 构建手动发送邮件的日志元数据
   * @param {SendEmailDto.SendChartEmailRequest} sendRequest 原始手动发送请求参数
   * @param {SendEmailVo.SendEmailResponse} [sendResult] 手动发送响应（如果发送成功的话）
   * @returns {Partial<ScheduledEmailLogDto.CreateExecutionLogRequest>} 构建好的手动发送日志元数据
   * @private
   */
  private buildManualSendMetadata(
    sendRequest: SendEmailDto.SendChartEmailRequest,
    sendResult?: SendEmailVo.SendEmailResponse
  ): Partial<ScheduledEmailLogDto.CreateExecutionLogRequest> {
    const attachmentNames = sendResult?.attachments
      ?.map((attachment) => attachment.filename)
      .filter((filename): filename is string => Boolean(filename))
    const fallbackAttachmentNames = sendRequest.analyzeOptions.filename
      ? [sendRequest.analyzeOptions.filename]
      : undefined
    const { transport, senderAddress, channel } = this.mailerProfile
    const transportHost = sendResult?.transport?.host || transport.host || undefined
    const transportPort = sendResult?.transport?.port || transport.port || undefined

    return {
      senderEmail: sendResult?.sender || senderAddress,
      recipientTo: this.normalizeRecipients(sendRequest.emailConfig.to),
      emailSubject: sendRequest.emailConfig.subject,
      attachmentNames: attachmentNames && attachmentNames.length > 0 ? attachmentNames : fallbackAttachmentNames,
      attachmentCount: attachmentNames?.length || fallbackAttachmentNames?.length || undefined,
      emailChannel: sendResult?.channel || channel,
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

  /**
   * 将各种形式的收件人类型归一化为标准的收件人邮箱地址数组
   * @param {string | string[]} [recipients] 收件人字符串或数组
   * @returns {string[]} 规整后的邮箱地址数组
   * @private
   */
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

  /**
   * 将 Nodemailer 接受/拒绝的收件人属性格式拍平为简洁的标准字符串数组
   * @param {Array<string | { name?: string; address: string }>} [recipients] Nodemailer 收件人列表
   * @returns {string[] | undefined} 拍平后的地址数组；如果为空则返回 undefined
   * @private
   */
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

/* ============================== 单例工厂 ============================== */

/**
 * 进程内全局持有的 ScheduledEmailLogService 单例实例
 * @type {ScheduledEmailLogService | null}
 */
let scheduledEmailLogServiceInstance: ScheduledEmailLogService | null = null

/**
 * 获取 ScheduledEmailLogService 的进程级单例
 * @returns {ScheduledEmailLogService} 单例实例对象
 */
export const getScheduledEmailLogService = (): ScheduledEmailLogService => {
  if (!scheduledEmailLogServiceInstance) {
    scheduledEmailLogServiceInstance = new ScheduledEmailLogService()
  }
  return scheduledEmailLogServiceInstance
}
