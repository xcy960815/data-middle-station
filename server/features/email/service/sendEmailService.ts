import { resolveMailerProfile, type MailerProfile } from '../domain/mailerProfile'
import {
  ChartSnapshotService,
  getChartSnapshotService,
  SUPPORTED_SERVER_RENDER_CHART_TYPES
} from './chartSnapshotService'
import chalk from 'chalk'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekday from 'dayjs/plugin/weekday.js'
import Joi from 'joi'
import nodemailer, { type Transporter } from 'nodemailer'

dayjs.extend(weekday)

/**
 * @desc 邮件服务专用的系统日志记录器
 * @type {Logger}
 */
const logger = new Logger({ fileName: 'email', folderName: 'server' })

/**
 * @desc Joi 参数验证选项，包括不提前中止、剔除未知字段、自动转换类型
 * @type {Joi.ValidationOptions}
 */
const SEND_EMAIL_VALIDATE_OPTIONS: Joi.ValidationOptions = {
  abortEarly: false,
  stripUnknown: true,
  convert: true
}

/**
 * @desc 基础邮箱格式正则校验
 * @type {RegExp}
 */
const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @desc 邮件发送图表类型参数校验 Schema
 * @type {Joi.StringSchema}
 */
const sendEmailChartTypeSchema = Joi.string()
  .valid(...SUPPORTED_SERVER_RENDER_CHART_TYPES)
  .optional()
  .messages({
    'any.only': `图表类型必须是 ${SUPPORTED_SERVER_RENDER_CHART_TYPES.join('、')} 之一`
  })

/**
 * @desc 将收件人字符串或数组解析并去重为干净的邮箱数组
 * @param {string | string[]} [recipients] 收件人（支持逗号/分号分隔的字符串，或字符串数组）
 * @returns {string[]} 解析后的清洗邮箱地址数组
 */
export const parseEmailRecipients = (recipients?: string | string[]): string[] => {
  if (!recipients) {
    return []
  }
  const recipientList = Array.isArray(recipients) ? recipients : recipients.split(/[,;]/)
  return recipientList.map((recipient) => recipient.trim()).filter(Boolean)
}

/**
 * @desc 邮件收件人 Joi 校验 Schema，内置邮箱格式及必填校验
 * @type {Joi.AlternativesSchema}
 */
export const emailRecipientsSchema = Joi.alternatives()
  .try(Joi.string(), Joi.array().items(Joi.string()))
  .custom((value, helpers) => {
    const recipients = parseEmailRecipients(value)
    if (recipients.length === 0) {
      return helpers.error('emailRecipients.empty')
    }
    const invalidEmails = recipients.filter((recipient) => !EMAIL_REGEXP.test(recipient))
    if (invalidEmails.length > 0) {
      return helpers.error('emailRecipients.invalid', { invalidEmails: invalidEmails.join(', ') })
    }
    return value
  }, 'validate email recipients')
  .required()
  .messages({
    'alternatives.match': '收件人邮箱格式不正确',
    'any.required': '收件人邮箱不能为空',
    'emailRecipients.empty': '收件人邮箱不能为空',
    'emailRecipients.invalid': '邮件地址格式错误: {#invalidEmails}'
  })

/**
 * @desc 手动发送邮件接口请求的 Joi 校验 Schema
 * @type {Joi.ObjectSchema<SendEmailDto.SendChartEmailRequest>}
 */
export const manualSendEmailSchema = Joi.object<SendEmailDto.SendChartEmailRequest>({
  emailConfig: Joi.object<SendEmailDto.EmailConfig>({
    to: emailRecipientsSchema,
    subject: Joi.string().min(1).max(200).required().messages({
      'string.min': '邮件主题不能为空',
      'string.max': '邮件主题不能超过200个字符',
      'any.required': '邮件主题不能为空'
    }),
    additionalContent: Joi.string().allow('').max(5000).optional().messages({
      'string.max': '附加内容不能超过5000个字符'
    })
  }).required(),
  analyzeOptions: Joi.object<SendEmailDto.AnalyzePayload>({
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
      'number.positive': '分析ID must be positive',
      'any.required': '分析ID不能为空'
    })
  }).required()
})

/**
 * @desc 校验邮件发送请求参数。
 * @template T
 * @param {Joi.ObjectSchema<T>} schema Joi 校验规则对象
 * @param {unknown} payload 待校验的请求参数载体
 * @returns {Joi.ValidationResult<T>} 校验结果对象
 */
export const validateSendEmailPayload = <T>(schema: Joi.ObjectSchema<T>, payload: unknown): Joi.ValidationResult<T> =>
  schema.validate(payload, SEND_EMAIL_VALIDATE_OPTIONS)

/**
 * @desc 格式化邮件发送参数校验错误。
 * @param {Joi.ValidationError} error Joi 校验错误对象
 * @returns {string} 格式化后的错误信息拼接字符串
 */
export const formatSendEmailValidationError = (error: Joi.ValidationError): string =>
  error.details.map((detail) => detail.message).join('; ')

/**
 * @desc 邮件附件定义接口
 * @interface Attachment
 */
interface Attachment {
  /**
   * @desc 附件文件名
   * @type {string}
   */
  filename: string
  /**
   * @desc 附件的 Content-Type 类型
   * @type {string}
   */
  contentType: string
  /**
   * @desc 附件的二进制或字符串内容
   * @type {string | Buffer<ArrayBufferLike>}
   */
  content?: string | Buffer<ArrayBufferLike>
  /**
   * @desc 附件的本地磁盘路径
   * @type {string}
   */
  path?: string
}

/**
 * @desc nodemailer 发送参数载体类型定义
 * @typedef {object} SendMailPayload
 * @property {string} from 发件人邮箱及名称
 * @property {string | string[]} to 收件人邮箱（字符串或数组）
 * @property {string} subject 邮件主题
 * @property {string} html 邮件正文 HTML 格式内容
 * @property {Attachment[]} attachments 附件数组列表
 */
type SendMailPayload = {
  from: string
  to: string | string[]
  subject: string
  html: string
  attachments: Attachment[]
}

/**
 * @desc 发送邮件服务，处理邮件传输器创建、图表快照组装及邮件最终发送
 * @class SendEmailService
 */
export class SendEmailService {
  /**
   * @desc nodemailer 邮件传输器对象
   * @type {Transporter<SendEmailDao.SendEmailResultRecord> | null}
   * @private
   */
  private transporter: Transporter<SendEmailDao.SendEmailResultRecord> | null = null
  /**
   * @desc 发件人画像（地址 / 通道 / 传输信息）
   * @type {MailerProfile}
   * @private
   */
  private mailerProfile: MailerProfile
  /**
   * @desc SMTP 鉴权用户名
   * @type {string | null}
   * @private
   */
  private smtpUser: string | null = null
  /**
   * @desc SMTP 鉴权密码
   * @type {string | null}
   * @private
   */
  private smtpPass: string | null = null
  /**
   * @desc 是否拒绝未授权的 SSL 证书（默认为 true，若设为 false 则允许自签名证书）
   * @type {boolean}
   * @private
   */
  private smtpRejectUnauthorized: boolean = true
  /**
   * @desc 图表快照服务实例
   * @type {ChartSnapshotService}
   * @private
   */
  private chartSnapshotService: ChartSnapshotService

  /**
   * @desc 构造函数，初始化发件配置及相关快照依赖服务
   */
  constructor() {
    this.mailerProfile = resolveMailerProfile()
    this.smtpRejectUnauthorized = String(useRuntimeConfig().smtpRejectUnauthorized ?? 'true') !== 'false'
    this.smtpUser = useRuntimeConfig().smtpUser
    this.smtpPass = useRuntimeConfig().smtpPass
    this.chartSnapshotService = getChartSnapshotService()
  }

  /**
   * @desc 根据当前配置创建 nodemailer 邮件传输器
   * @throws {Error} 当 host、user、pass 等 SMTP 配置缺失时抛出错误
   * @private
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
   * @desc 发送邮件主逻辑，自动补全分析图表快照并构造 HTML 载体
   * @param {SendEmailDto.SendChartEmailRequest} sendEmailRequest 邮件发送请求参数
   * @returns {Promise<SendEmailVo.SendEmailResponse>} 返回邮件发送结果和响应参数
   */
  public async sendMail(sendEmailRequest: SendEmailDto.SendChartEmailRequest): Promise<SendEmailVo.SendEmailResponse> {
    if (!this.transporter) {
      this.createTransporter()
    }

    // 根据 analyzeId 自动补全图表信息
    const resolvedAnalyzePayload = await this.resolveAnalyzePayload(sendEmailRequest.analyzeOptions)

    // 构建附件配置
    const attachments = this.buildAttachments(resolvedAnalyzePayload)
    const mailPayload = this.buildSendMailPayload(sendEmailRequest, attachments, resolvedAnalyzePayload)

    const sendResult = await this.transporter!.sendMail(mailPayload)
    const sendResultResponse = this.convertResultRecordToResponse({
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

    logger.info(`邮件已发送，messageId=${sendResult.messageId}，收件人=${chalk.cyan(sendEmailRequest.emailConfig.to)}`)

    return {
      messageId: sendResultResponse.messageId,
      accepted: sendResultResponse.accepted,
      rejected: sendResultResponse.rejected,
      ehlo: sendResultResponse.ehlo,
      envelopeTime: sendResultResponse.envelopeTime,
      messageTime: sendResultResponse.messageTime,
      messageSize: sendResultResponse.messageSize,
      response: sendResultResponse.response,
      envelope: sendResultResponse.envelope,
      sender: sendResultResponse.sender || this.getSenderAddress(),
      channel: sendResultResponse.channel || this.getChannel(),
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
   * @desc 组装 nodemailer 发送参数。
   * @param {SendEmailDto.SendChartEmailRequest} sendEmailRequest 邮件请求
   * @param {Attachment[]} attachments 附件列表
   * @param {SendEmailDto.AnalyzePayload} analyzeOptions 图表选项
   * @returns {SendMailPayload} 包装后的 nodemailer 发送参数
   * @throws {Error} 当收件人为空时抛出错误
   * @private
   */
  private buildSendMailPayload(
    sendEmailRequest: SendEmailDto.SendChartEmailRequest,
    attachments: Attachment[],
    analyzeOptions: SendEmailDto.AnalyzePayload
  ): SendMailPayload {
    const recipients = parseEmailRecipients(sendEmailRequest.emailConfig.to)
    if (recipients.length === 0) {
      throw new Error('收件人邮箱不能为空')
    }
    return {
      from: this.getSenderAddress(),
      to: recipients,
      subject: sendEmailRequest.emailConfig.subject,
      html: this.buildEmailContent(sendEmailRequest.emailConfig, analyzeOptions),
      attachments
    }
  }

  /**
   * @desc nodemailer 原始数据库/API结果记录 -> 统一接口响应对象的转换
   * @param {SendEmailDao.SendEmailResultRecord} sendResult nodemailer 返回的底层发送记录
   * @returns {SendEmailVo.SendEmailResponse} 格式化后的邮件发送结果响应对象
   * @private
   */
  private convertResultRecordToResponse(sendResult: SendEmailDao.SendEmailResultRecord): SendEmailVo.SendEmailResponse {
    return {
      ...sendResult,
      sender: this.getSenderAddress(),
      channel: this.getChannel()
    }
  }

  /**
   * @desc 根据分析载体参数构建邮件附件配置
   * @param {SendEmailDto.AnalyzePayload} analyzeOptions 包含图表文件信息的载体
   * @returns {Attachment[]} 附件配置数组，如果缺少配置则返回空数组
   * @private
   */
  private buildAttachments(analyzeOptions: SendEmailDto.AnalyzePayload): Array<Attachment> {
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
   * @desc 根据 analyzeId 自动生成附件所需的图表快照并补齐选项
   * @param {SendEmailDto.AnalyzePayload} analyzeOptions 原始图表附件参数载体
   * @returns {Promise<SendEmailDto.AnalyzePayload>} 补齐快照内容及文件名的图表附件参数
   * @throws {Error} 当缺少参数或文件名无法生成快照时抛出错误
   * @private
   */
  private async resolveAnalyzePayload(
    analyzeOptions: SendEmailDto.AnalyzePayload
  ): Promise<SendEmailDto.AnalyzePayload> {
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
   * @desc 构建邮件 HTML 格式内容
   * @param {SendEmailDto.EmailConfig} emailConfig 邮件正文基础配置
   * @param {SendEmailDto.AnalyzePayload} analyzeOptions 图表详情信息
   * @returns {string} 渲染后的完整 HTML 字符串
   * @private
   */
  private buildEmailContent(
    emailConfig: SendEmailDto.EmailConfig,
    analyzeOptions: SendEmailDto.AnalyzePayload
  ): string {
    const escapedSubject = this.escapeHtml(emailConfig.subject)
    const escapedAnalyzeName = this.escapeHtml(analyzeOptions.analyzeName || '')
    const additionalContent = emailConfig.additionalContent
      ? `<div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
           <p style="margin: 0; color: #495057;">${this.escapeHtml(emailConfig.additionalContent).replace(/\n/g, '<br>')}</p>
         </div>`
      : ''
    // 安全顺序：先 escapeHtml 再替换 \n。escapeHtml 不会产出 \n，所以替换阶段不会引入 XSS。

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${escapedSubject}</title>
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
              <p style="margin: 5px 0;"><strong>图表标题:</strong> ${escapedAnalyzeName}</p>
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
   * @desc 转义 HTML 敏感字符，防止邮件渲染时产生 XSS 注入
   * @param {string} value 原始字符串
   * @returns {string} 转义后的安全字符串
   * @private
   */
  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }
      return htmlEntities[character] || character
    })
  }

  /**
   * @desc 获取默认的发件人邮箱地址
   * @returns {string} 发件人邮箱地址
   */
  public getSenderAddress(): string {
    return this.mailerProfile.senderAddress
  }

  /**
   * @desc 获取邮件通道底层的连接传输配置（host, port, secure）
   * @returns {{ host: string; port: number; secure: boolean }} 传输参数配置对象
   */
  public getTransportInfo(): { host: string; port: number; secure: boolean } {
    return this.mailerProfile.transport
  }

  /**
   * @desc 获取当前生效的邮件发送通道标识
   * @returns {string} 通道标识
   */
  public getChannel(): string {
    return this.mailerProfile.channel
  }
}

/* ============================== 单例工厂 ============================== */

/**
 * @desc SendEmailService 进程级单例存储变量
 * @type {SendEmailService | null}
 */
let sendEmailServiceInstance: SendEmailService | null = null

/**
 * @desc 获取 SendEmailService 的进程级单例
 *  - 共享 transporter，避免每次请求重新构造 SMTP 连接
 *  - 共享 ChartSnapshotService（其内部还会拉起 AnalyzeService / ChartDataService）
 *  - 测试场景仍可直接 `new SendEmailService()`
 * @returns {SendEmailService} SendEmailService 进程级单例
 */
export const getSendEmailService = (): SendEmailService => {
  if (!sendEmailServiceInstance) {
    sendEmailServiceInstance = new SendEmailService()
  }
  return sendEmailServiceInstance
}
