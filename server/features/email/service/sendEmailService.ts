import { resolveMailerProfile, type MailerProfile } from '../domain/mailerProfile'
import { ChartSnapshotService, SUPPORTED_SERVER_RENDER_CHART_TYPES } from './chartSnapshotService'
import chalk from 'chalk'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekday from 'dayjs/plugin/weekday.js'
import Joi from 'joi'
import nodemailer, { type Transporter } from 'nodemailer'

dayjs.extend(weekday)

const logger = new Logger({ fileName: 'email', folderName: 'server' })
const SEND_EMAIL_VALIDATE_OPTIONS: Joi.ValidationOptions = {
  abortEarly: false,
  stripUnknown: true,
  convert: true
}

const sendEmailChartTypeSchema = Joi.string()
  .valid(...SUPPORTED_SERVER_RENDER_CHART_TYPES)
  .optional()
  .messages({
    'any.only': `图表类型必须是 ${SUPPORTED_SERVER_RENDER_CHART_TYPES.join('、')} 之一`
  })

export const manualSendEmailSchema = Joi.object<SendEmailDto.SendEmailOptions>({
  emailConfig: Joi.object<SendEmailDto.EmailConfig>({
    to: Joi.string().email().required().messages({
      'string.email': '收件人邮箱格式不正确',
      'any.required': '收件人邮箱不能为空'
    }),
    subject: Joi.string().min(1).max(200).required().messages({
      'string.min': '邮件主题不能为空',
      'string.max': '邮件主题不能超过200个字符',
      'any.required': '邮件主题不能为空'
    }),
    additionalContent: Joi.string().allow('').max(5000).optional().messages({
      'string.max': '附加内容不能超过5000个字符'
    })
  }).required(),
  analyzeOptions: Joi.object<SendEmailDto.AnalyzeOption>({
    filename: Joi.string().min(1).max(100).optional().messages({
      'string.min': '文件名不能为空',
      'string.max': '文件名不能超过100个字符'
    }),
    chartType: sendEmailChartTypeSchema,
    analyzeName: Joi.string().min(1).max(100).optional().messages({
      'string.min': '分析名称不能为空',
      'string.max': '分析名称不能超过100个字符'
    }),
    analyzeId: Joi.number().integer().positive().required().messages({
      'number.base': '分析ID必须是数字',
      'number.integer': '分析ID必须是整数',
      'number.positive': '分析ID必须大于0',
      'any.required': '分析ID不能为空'
    })
  }).required()
})

/**
 * @desc 校验邮件发送请求参数。
 */
export const validateSendEmailPayload = <T>(schema: Joi.ObjectSchema<T>, payload: unknown): Joi.ValidationResult<T> =>
  schema.validate(payload, SEND_EMAIL_VALIDATE_OPTIONS)

/**
 * @desc 格式化邮件发送参数校验错误。
 */
export const formatSendEmailValidationError = (error: Joi.ValidationError): string =>
  error.details.map((detail) => detail.message).join('; ')

/**
 * @desc 邮件附件定义
 */
interface Attachment {
  filename: string
  contentType: string
  content?: string | Buffer<ArrayBufferLike>
  path?: string
}

/**
 * @desc nodemailer 发送参数载体
 */
type SendMailPayload = {
  from: string
  to: string | string[]
  subject: string
  html: string
  attachments: Attachment[]
}
/**
 * @desc 发送邮件服务
 */
export class SendEmailService {
  /**
   * @desc 邮件传输器
   */
  private transporter: Transporter<SendEmailDao.SendEmailOptions> | null = null
  /**
   * @desc 发件人画像（地址 / 通道 / 传输信息），由 mailerProfile 统一解析
   */
  private mailerProfile: MailerProfile
  /**
   * @desc SMTP 鉴权用户
   */
  private smtpUser: string | null = null
  /**
   * @desc SMTP 鉴权密码
   */
  private smtpPass: string | null = null
  /**
   * @desc 是否校验证书
   */
  private smtpRejectUnauthorized: boolean = true
  /**
   * @desc 图表快照服务
   */
  private chartSnapshotService: ChartSnapshotService

  constructor() {
    this.mailerProfile = resolveMailerProfile()
    this.smtpRejectUnauthorized = String(useRuntimeConfig().smtpRejectUnauthorized ?? 'true') !== 'false'
    this.smtpUser = useRuntimeConfig().smtpUser
    this.smtpPass = useRuntimeConfig().smtpPass
    this.chartSnapshotService = new ChartSnapshotService()
  }

  /**
   * @desc 创建邮件传输器
   */
  private createTransporter(): void {
    const missingConfigs = [
      ['SMTP_HOST', this.mailerProfile.transport.host],
      ['SMTP_USER', this.smtpUser],
      ['SMTP_PASS', this.smtpPass]
    ]
      .filter(([, value]) => !value)
      .map(([configKey]) => configKey)

    if (missingConfigs.length > 0) {
      throw new Error(`SMTP配置缺失: ${missingConfigs.join(', ')}`)
    }

    this.transporter = nodemailer.createTransport({
      host: this.mailerProfile.transport.host,
      port: this.mailerProfile.transport.port,
      secure: this.mailerProfile.transport.secure,
      auth: {
        user: this.smtpUser!,
        pass: this.smtpPass!
      },
      tls: {
        rejectUnauthorized: this.smtpRejectUnauthorized
      }
    })
  }

  /**
   * @desc 发送邮件
   * @param sendOptions {SendEmailDto.SendEmailOptions}
   * @returns {Promise<SendEmailVo.SendEmailOptions>} messageId
   */
  public async sendMail(sendOptions: SendEmailDto.SendEmailOptions): Promise<SendEmailVo.SendEmailOptions> {
    if (!this.transporter) {
      this.createTransporter()
    }

    // 根据 analyzeId 自动补全图表信息
    const resolvedAnalyzeOptions = await this.resolveAnalyzeOptions(sendOptions.analyzeOptions)

    // 构建附件配置
    const attachments = this.buildAttachments(resolvedAnalyzeOptions)
    const mailPayload = this.convertDtoToDao(sendOptions, attachments, resolvedAnalyzeOptions)

    const sendResult = await this.transporter!.sendMail(mailPayload)
    const sendResultData = this.convertDaoToDto({
      messageId: sendResult.messageId,
      accepted: sendResult.accepted,
      rejected: sendResult.rejected,
      ehlo: sendResult.ehlo,
      envelopeTime: sendResult.envelopeTime,
      messageTime: sendResult.messageTime,
      messageSize: sendResult.messageSize,
      response: sendResult.response,
      envelope: sendResult.envelope
    })

    logger.info(`邮件已发送，messageId=${sendResult.messageId}，收件人=${chalk.cyan(sendOptions.emailConfig.to)}`)

    return {
      messageId: sendResultData.messageId,
      accepted: sendResultData.accepted,
      rejected: sendResultData.rejected,
      ehlo: sendResultData.ehlo,
      envelopeTime: sendResultData.envelopeTime,
      messageTime: sendResultData.messageTime,
      messageSize: sendResultData.messageSize,
      response: sendResultData.response,
      envelope: sendResultData.envelope,
      sender: sendResultData.sender || this.getSenderAddress(),
      channel: sendResultData.channel || this.getChannel(),
      transport: this.getTransportInfo(),
      attachments: attachments.map((item) => ({
        filename: item.filename,
        contentType: item.contentType,
        size:
          typeof item.content === 'string'
            ? Buffer.byteLength(item.content)
            : item.content
              ? item.content.length
              : undefined
      }))
    }
  }

  /**
   * @desc DTO -> nodemailer 发送参数转换
   * @param sendOptions {SendEmailDto.SendEmailOptions} 邮件请求
   * @param attachments {Attachment[]} 附件列表
   * @param analyzeOptions {SendEmailDto.AnalyzeOption} 图表选项
   */
  private convertDtoToDao(
    sendOptions: SendEmailDto.SendEmailOptions,
    attachments: Attachment[],
    analyzeOptions: SendEmailDto.AnalyzeOption
  ): SendMailPayload {
    return {
      from: this.getSenderAddress(),
      to: sendOptions.emailConfig.to,
      subject: sendOptions.emailConfig.subject,
      html: this.buildEmailContent(sendOptions.emailConfig, analyzeOptions),
      attachments
    }
  }

  /**
   * @desc nodemailer 结果 -> DTO 转换
   * @param sendResult {SendEmailDao.SendEmailOptions} nodemailer 返回结果
   */
  private convertDaoToDto(sendResult: SendEmailDao.SendEmailOptions): SendEmailDto.SendEmailResultDto {
    return {
      ...sendResult,
      sender: this.getSenderAddress(),
      channel: this.getChannel()
    }
  }

  /**
   * @desc 构建附件配置
   * @param analyzeOptions {SendEmailDto.AnalyzeOption}
   * @returns {Array}
   */
  private buildAttachments(analyzeOptions: SendEmailDto.AnalyzeOption): Array<Attachment> {
    if (!analyzeOptions.filename) {
      return []
    }

    // 根据文件扩展名设置 content type
    const isSvg = analyzeOptions.filename.toLowerCase().endsWith('.svg')
    const contentType = isSvg ? 'image/svg+xml' : 'image/svg+xml'

    const attachment: Attachment = {
      filename: analyzeOptions.filename,
      contentType
    }

    // 优先使用文件内容
    if (analyzeOptions.fileContent) {
      attachment.content = analyzeOptions.fileContent
    } else if (analyzeOptions.filePath) {
      attachment.path = analyzeOptions.filePath
    } else {
      // 如果既没有内容也没有路径，记录警告但不添加附件
      logger.warn(`邮件附件 ${analyzeOptions.filename} 缺少内容或路径，将跳过附件`)
      return []
    }

    return [attachment]
  }

  /**
   * 根据 analyzeId 自动生成附件所需的图表快照
   */
  private async resolveAnalyzeOptions(analyzeOptions: SendEmailDto.AnalyzeOption): Promise<SendEmailDto.AnalyzeOption> {
    if (analyzeOptions.fileContent || analyzeOptions.filePath) {
      if (!analyzeOptions.filename) {
        throw new Error('缺少附件文件名，无法发送邮件')
      }
      return analyzeOptions
    }

    if (!analyzeOptions.analyzeId) {
      throw new Error('缺少分析ID，无法生成图表附件')
    }

    const snapshot = await this.chartSnapshotService.renderAnalyzeChart(analyzeOptions.analyzeId)
    logger.info(`已为分析 ${analyzeOptions.analyzeId} 生成图表快照用于发送邮件`)

    return {
      ...analyzeOptions,
      filename: analyzeOptions.filename || snapshot.filename,
      analyzeName: analyzeOptions.analyzeName || snapshot.analyzeName,
      chartType: snapshot.chartType,
      fileContent: snapshot.buffer
    }
  }

  /**
   * @desc 构建邮件内容
   * @param emailConfig {SendEmailDto.EmailConfig}
   * @param analyzeOptions {SendEmailDto.AnalyzeOption}
   * @returns {string}
   */
  private buildEmailContent(emailConfig: SendEmailDto.EmailConfig, analyzeOptions: SendEmailDto.AnalyzeOption): string {
    const additionalContent = emailConfig.additionalContent
      ? `<div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
           <p style="margin: 0; color: #495057;">${emailConfig.additionalContent.replace(/\n/g, '<br>')}</p>
         </div>`
      : ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${emailConfig.subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; }
          .content { margin-bottom: 30px; }
          .chart-info { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📊 数据分析报告</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${dayjs().locale('zh-cn').format('YYYY年MM月DD日 dddd')}</p>
          </div>

          <div class="content">
            ${additionalContent}

            <div class="chart-info">
              <h3 style="margin-top: 0; color: #495057;">📈 图表信息</h3>
              <p style="margin: 5px 0;"><strong>图表标题:</strong> ${analyzeOptions.analyzeName}</p>
              <p style="margin: 5px 0;"><strong>生成时间:</strong> ${dayjs().locale('zh-cn').format('YYYY年MM月DD日 HH:mm:ss')}</p>
            </div>

            <p>📎 图表图片已作为附件发送，请查看附件获取高清图表。</p>
          </div>

          <div class="footer">
            <p style="margin: 0;">此邮件由数据中台自动发送，如有疑问请联系管理员。</p>
            <p style="margin: 5px 0 0 0;">🤖 定时任务系统</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * 获取默认发件地址
   */
  public getSenderAddress(): string {
    return this.mailerProfile.senderAddress
  }

  /**
   * 获取传输信息
   */
  public getTransportInfo(): { host: string; port: number; secure: boolean } {
    return this.mailerProfile.transport
  }

  /**
   * 获取当前通道
   */
  public getChannel(): string {
    return this.mailerProfile.channel
  }
}
