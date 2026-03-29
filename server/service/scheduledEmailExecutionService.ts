import { ScheduledEmailMapper } from '@/server/mapper/scheduledEmailMapper'
import { BaseService } from '@/server/service/baseService'
import { ScheduledEmailLogService } from '@/server/service/scheduledEmailLogService'
import { SendEmailService } from '@/server/service/sendEmailService'
import { calculateNextExecutionTime } from '@/server/utils/schedulerUtils'
import dayjs from 'dayjs'
import { normalizeEmailRecipients } from '~/shared/emailUtils'

const logger = new Logger({ fileName: 'scheduled-email', folderName: 'server' })

/**
 * 定时邮件任务执行服务。
 * 只负责任务执行、重试、调度推进和执行日志整形。
 */
export class ScheduledEmailExecutionService extends BaseService {
  private scheduledEmailMapper: ScheduledEmailMapper
  private scheduledEmailLogService: ScheduledEmailLogService
  private sendEmailService: SendEmailService

  constructor() {
    super()
    this.scheduledEmailMapper = new ScheduledEmailMapper()
    this.scheduledEmailLogService = new ScheduledEmailLogService()
    this.sendEmailService = new SendEmailService()
  }

  async executeTask(executeOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask({ id: executeOptions.id })
      if (!scheduledEmailRecord) {
        throw new Error('任务不存在')
      }

      if (scheduledEmailRecord.status !== 'pending') {
        throw new Error('只有待执行的任务可以立即执行')
      }

      return this.processTask(scheduledEmailRecord)
    } catch (error) {
      logger.error(`立即执行任务失败: ${executeOptions.id}, ${error}`)
      throw error
    }
  }

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

      if (!this.canExecuteTask(scheduledEmailRecord)) {
        logger.warn(`任务 ${scheduledEmailRecord.id} 当前状态为 ${scheduledEmailRecord.status}，跳过执行`)
        return false
      }

      return this.processTask(scheduledEmailRecord)
    } catch (error) {
      logger.error(`执行任务失败: ${JSON.stringify(queryOptions)}, ${error}`)
      return false
    }
  }

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

  async processExactTimeTasks(): Promise<void> {
    try {
      const now = new Date()
      const currentTime = now.toISOString().slice(0, 19).replace('T', ' ')
      const futureTime = new Date(now.getTime() + 30 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      const exactTaskRecordList = await this.scheduledEmailMapper.getExactTimeTasks(currentTime, futureTime)

      logger.info(`发现 ${exactTaskRecordList.length} 个精确时间任务`)

      for (const taskRecord of exactTaskRecordList) {
        if (!taskRecord.scheduleTime) continue

        const scheduleTime = new Date(taskRecord.scheduleTime)
        const timeDiff = scheduleTime.getTime() - now.getTime()

        if (timeDiff <= 10000 && timeDiff >= 0) {
          logger.info(`执行精确时间任务: ${taskRecord.id}, 时间差: ${timeDiff}ms`)
          await this.processTask(taskRecord)
        }
      }
    } catch (error) {
      logger.error(`处理精确时间任务失败: ${error}`)
    }
  }

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

  private async processTask(scheduledEmailRecord: ScheduledEmailDao.ScheduledEmailOptions): Promise<boolean> {
    const startTime = Date.now()
    let success = false
    let errorMessage = ''

    const { updatedBy, updateTime } = await super.getDefaultInfo()
    const emailConfig = scheduledEmailRecord.emailConfig
    const analyzeOptions = scheduledEmailRecord.analyzeOptions

    try {
      const scheduleTime = scheduledEmailRecord.scheduleTime ? new Date(scheduledEmailRecord.scheduleTime) : new Date()
      const now = new Date()
      const timeDiff = now.getTime() - scheduleTime.getTime()

      if (timeDiff > 0) {
        logger.warn(`任务 ${scheduledEmailRecord.id} 延迟执行 ${timeDiff}ms`)
      } else if (timeDiff < -1000) {
        logger.warn(`任务 ${scheduledEmailRecord.id} 提前执行 ${Math.abs(timeDiff)}ms`)
      }

      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailRecord,
        id: scheduledEmailRecord.id,
        status: 'running',
        executedTime: updateTime,
        updatedTime: updateTime,
        updatedBy
      })

      const baseLogMetadata = this.buildBaseLogMetadata(emailConfig, analyzeOptions, scheduledEmailRecord.retryCount)

      const result = await this.sendEmailService.sendMail({
        emailConfig: {
          to: emailConfig.to,
          subject: emailConfig.subject,
          additionalContent: emailConfig.additionalContent || ''
        },
        analyzeOptions: {
          ...analyzeOptions
        }
      })

      const nextExecutionTime =
        scheduledEmailRecord.taskType === 'recurring'
          ? calculateNextExecutionTime(
              scheduledEmailRecord.recurringDays || [],
              scheduledEmailRecord.recurringTime || '',
              new Date()
            )
          : scheduledEmailRecord.nextExecutionTime || null

      if (scheduledEmailRecord.taskType === 'recurring' && !nextExecutionTime) {
        throw new Error('重复任务执行成功后无法计算下次执行时间')
      }

      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailRecord,
        id: scheduledEmailRecord.id,
        status: scheduledEmailRecord.taskType === 'recurring' ? 'pending' : 'completed',
        errorMessage: undefined,
        retryCount: 0,
        nextExecutionTime,
        updatedTime: updateTime,
        updatedBy
      })

      await this.scheduledEmailLogService.logTaskSuccess(
        scheduledEmailRecord.id,
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
        result.messageId,
        Date.now() - startTime,
        '邮件发送成功',
        this.enrichLogMetadata(baseLogMetadata, result)
      )

      success = true
      logger.info(`任务执行成功: ${scheduledEmailRecord.id}, messageId: ${result.messageId}`)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : '未知错误'

      const newRetryCount = scheduledEmailRecord.retryCount + 1

      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailRecord,
        id: scheduledEmailRecord.id,
        status: 'failed',
        errorMessage,
        retryCount: newRetryCount,
        executedTime: updateTime,
        updatedTime: updateTime,
        updatedBy
      })

      await this.scheduledEmailLogService.logTaskFailure(
        scheduledEmailRecord.id,
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
        `任务执行失败: ${scheduledEmailRecord.id}, 重试次数: ${newRetryCount}/${scheduledEmailRecord.maxRetries}, 错误: ${errorMessage}`
      )
    }

    return success
  }

  private buildBaseLogMetadata(
    emailConfig: ScheduledEmailDto.EmailConfig,
    analyzeOptions: ScheduledEmailDto.AnalyzeOptions,
    retryCount: number
  ): Partial<ScheduledEmailLogDto.CreateLogOptions> {
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
    baseMetadata: Partial<ScheduledEmailLogDto.CreateLogOptions>,
    sendResult: SendEmailVo.SendEmailOptions
  ): Partial<ScheduledEmailLogDto.CreateLogOptions> {
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

  private ensureStringArray(value: string | string[] | null | undefined): string[] | undefined {
    if (!value) {
      return undefined
    }
    return Array.isArray(value) ? value : [value]
  }

  private normalizeRecipients(recipients?: string | string[]): string[] {
    return normalizeEmailRecipients(recipients)
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

  private canExecuteTask(task: ScheduledEmailDao.ScheduledEmailOptions): boolean {
    if (task.status === 'cancelled' || task.status === 'completed' || task.status === 'running') {
      return false
    }

    return task.status === 'pending' || task.status === 'failed'
  }
}
