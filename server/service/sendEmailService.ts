import { ChartSnapshotService } from '@/server/service/chartSnapshotService'
import chalk from 'chalk'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekday from 'dayjs/plugin/weekday.js'
import nodemailer, { type Transporter } from 'nodemailer'
import { isMailSupportedChartType, normalizeEmailRecipients } from '~/shared/emailUtils'

dayjs.extend(weekday)

const logger = new Logger({ fileName: 'email', folderName: 'server' })

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
   * @desc 邮件配置
   */
  private smtpHost: string | null = null
  /**
   * @desc 邮件端口
   */
  private smtpPort: number | null = null
  /**
   * @desc 邮件是否安全
   */
  private smtpSecure: boolean = false
  /**
   * @desc 邮件用户
   */
  private smtpUser: string | null = null
  /**
   * @desc 邮件密码
   */
  private smtpPass: string | null = null
  /**
   * @desc 邮件发件人
   */
  private smtpFrom: string | null = null
  /**
   * @desc 图表快照服务
   */
  private chartSnapshotService: ChartSnapshotService

  constructor() {
    this.smtpHost = useRuntimeConfig().smtpHost
    this.smtpPort = useRuntimeConfig().smtpPort ? Number(useRuntimeConfig().smtpPort) : 465
    this.smtpSecure = String(useRuntimeConfig().smtpSecure || 'true') === 'true'
    this.smtpUser = useRuntimeConfig().smtpUser
    this.smtpPass = useRuntimeConfig().smtpPass
    this.smtpFrom = useRuntimeConfig().smtpFrom
    this.createTransporter()
    this.chartSnapshotService = new ChartSnapshotService()
  }

  /**
   * @desc 创建邮件传输器
   * @description 根据运行时 SMTP 配置初始化 nodemailer 传输实例。
   */
  private createTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.smtpHost!,
      port: this.smtpPort!,
      secure: this.smtpSecure,
      auth: {
        user: this.smtpUser!,
        pass: this.smtpPass!
      },
      tls: {
        rejectUnauthorized: false
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

    const normalizedRecipients = normalizeEmailRecipients(sendOptions.emailConfig.to)
    if (normalizedRecipients.length === 0) {
      throw new Error('缺少有效的收件人地址')
    }

    // 根据 analyzeId 自动补全图表信息
    const resolvedAnalyzeOptions = await this.resolveAnalyzeOptions(sendOptions.analyzeOptions)

    // 构建附件配置
    const attachments = this.buildAttachments(resolvedAnalyzeOptions)
    const mailPayload = this.convertDtoToDao(
      {
        ...sendOptions,
        emailConfig: {
          ...sendOptions.emailConfig,
          to: normalizedRecipients
        }
      },
      attachments,
      resolvedAnalyzeOptions
    )

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

    logger.info(`邮件已发送，messageId=${sendResult.messageId}，收件人=${chalk.cyan(normalizedRecipients.join(', '))}`)

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
   * @param analyzeOptions {SendEmailDto.AnalyzeOptions} 图表选项
   * @description 统一把业务层请求组装为 nodemailer 可直接消费的 payload。
   */
  private convertDtoToDao(
    sendOptions: SendEmailDto.SendEmailOptions,
    attachments: Attachment[],
    analyzeOptions: SendEmailDto.AnalyzeOptions
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
   * @param analyzeOptions {SendEmailDto.AnalyzeOptions}
   * @returns {Array}
   * @description 当前邮件模块统一以 SVG 快照作为附件输出。
   */
  private buildAttachments(analyzeOptions: SendEmailDto.AnalyzeOptions): Array<Attachment> {
    if (!analyzeOptions.filename) {
      return []
    }

    // 根据文件扩展名设置 content type
    const attachment: Attachment = {
      filename: analyzeOptions.filename,
      contentType: 'image/svg+xml'
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
   * @description 若调用方未直接提供附件内容，则退化为服务端按分析配置生成快照。
   */
  private async resolveAnalyzeOptions(
    analyzeOptions: SendEmailDto.AnalyzeOptions
  ): Promise<SendEmailDto.AnalyzeOptions> {
    if (analyzeOptions.chartType && !isMailSupportedChartType(analyzeOptions.chartType)) {
      throw new Error(`邮件功能暂不支持 ${analyzeOptions.chartType} 图表`)
    }

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
   * @param analyzeOptions {SendEmailDto.AnalyzeOptions}
   * @returns {string}
   * @description 构建邮件正文时会对用户输入做基础 HTML 转义，避免破坏模板结构。
   */
  private buildEmailContent(
    emailConfig: SendEmailDto.EmailConfig,
    analyzeOptions: SendEmailDto.AnalyzeOptions
  ): string {
    const safeSubject = this.escapeHtml(emailConfig.subject)
    const safeAnalyzeName = this.escapeHtml(analyzeOptions.analyzeName || '未命名分析')
    const additionalContent = emailConfig.additionalContent
      ? `<div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
           <p style="margin: 0; color: #495057;">${this.escapeHtml(emailConfig.additionalContent).replace(/\n/g, '<br>')}</p>
         </div>`
      : ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${safeSubject}</title>
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
              <p style="margin: 5px 0;"><strong>图表标题:</strong> ${safeAnalyzeName}</p>
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
   * @description 优先使用显式配置的发件地址，其次回退到 SMTP 用户名。
   */
  public getSenderAddress(): string {
    return this.smtpFrom || this.smtpUser || 'system@unknown'
  }

  /**
   * 获取传输信息
   * @description 供日志记录与调度层透传 SMTP 链路信息。
   */
  public getTransportInfo(): { host: string; port: number; secure: boolean } {
    return {
      host: this.smtpHost || '',
      port: this.smtpPort || 0,
      secure: this.smtpSecure
    }
  }

  /**
   * 获取当前通道
   * @description 用于日志中区分 SMTP 与 SMTPS。
   */
  public getChannel(): string {
    return this.smtpSecure ? 'smtps' : 'smtp'
  }

  /**
   * 对注入到 HTML 模板中的文本做基础转义。
   */
  private escapeHtml(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}
