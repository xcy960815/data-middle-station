import { ChartSnapshotService } from '@/server/service/chartSnapshotService'
import nodemailer, { type Transporter } from 'nodemailer'

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
   */
  private createTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.smtpHost!,
      port: this.smtpPort!,
      secure: this.smtpSecure,
      auth: {
        user: this.smtpUser!,
        pass: this.smtpPass!
      }
    })
  }

  /**
   * @desc 发送邮件
   * @param options {SendEmailDto.SendChartEmailRequest}
   * @returns {Promise<SendEmailVo.SendEmailResponse>} messageId
   */
  public async sendMail(sendMailDto: SendEmailDto.SendChartEmailRequest): Promise<SendEmailVo.SendEmailResponse> {
    if (!this.transporter) {
      this.createTransporter()
    }

    // 根据 analyzeId 自动补全图表信息
    const resolvedAnalyzeOptions = await this.resolveAnalyzeOptions(sendMailDto.analyzeOptions)

    // 构建附件配置
    const attachments = this.buildAttachments(resolvedAnalyzeOptions)
    const mailPayload = this.convertDtoToDao(sendMailDto, attachments, resolvedAnalyzeOptions)

    const result = await this.transporter!.sendMail(mailPayload)
    const resultDto = this.convertDaoToDto({
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      ehlo: result.ehlo,
      envelopeTime: result.envelopeTime,
      messageTime: result.messageTime,
      messageSize: result.messageSize,
      response: result.response,
      envelope: result.envelope
    })

    logger.info(`邮件已发送，messageId=${result.messageId}，收件人=${sendMailDto.emailConfig.to}`)

    return {
      messageId: resultDto.messageId,
      accepted: resultDto.accepted,
      rejected: resultDto.rejected,
      ehlo: resultDto.ehlo,
      envelopeTime: resultDto.envelopeTime,
      messageTime: resultDto.messageTime,
      messageSize: resultDto.messageSize,
      response: resultDto.response,
      envelope: resultDto.envelope,
      sender: resultDto.sender || this.getSenderAddress(),
      channel: resultDto.channel || this.getChannel(),
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
   * @param sendMailDto {SendEmailDto.SendChartEmailRequest} 邮件请求
   * @param attachments {Attachment[]} 附件列表
   * @param analyzeOptions {SendEmailDto.AnalyzeOptions} 图表选项
   */
  private convertDtoToDao(
    sendMailDto: SendEmailDto.SendChartEmailRequest,
    attachments: Attachment[],
    analyzeOptions: SendEmailDto.AnalyzeOptions
  ): SendMailPayload {
    return {
      from: this.getSenderAddress(),
      to: sendMailDto.emailConfig.to,
      subject: sendMailDto.emailConfig.subject,
      html: this.buildEmailContent(sendMailDto.emailConfig, analyzeOptions),
      attachments
    }
  }

  /**
   * @desc nodemailer 结果 -> DTO 转换
   * @param result {SendEmailDao.SendEmailOptions} nodemailer 返回结果
   */
  private convertDaoToDto(result: SendEmailDao.SendEmailOptions): SendEmailDto.SendEmailResultDto {
    return {
      ...result,
      sender: this.getSenderAddress(),
      channel: this.getChannel()
    }
  }

  /**
   * @desc 构建附件配置
   * @param analyzeOptions {SendEmailDto.AnalyzeOptions}
   * @returns {Array}
   */
  private buildAttachments(analyzeOptions: SendEmailDto.AnalyzeOptions): Array<Attachment> {
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
  private async resolveAnalyzeOptions(
    analyzeOptions: SendEmailDto.AnalyzeOptions
  ): Promise<SendEmailDto.AnalyzeOptions> {
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
   */
  private buildEmailContent(
    emailConfig: SendEmailDto.EmailConfig,
    analyzeOptions: SendEmailDto.AnalyzeOptions
  ): string {
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
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}</p>
          </div>

          <div class="content">
            ${additionalContent}

            <div class="chart-info">
              <h3 style="margin-top: 0; color: #495057;">📈 图表信息</h3>
              <p style="margin: 5px 0;"><strong>图表标题:</strong> ${analyzeOptions.analyzeName}</p>
              <p style="margin: 5px 0;"><strong>生成时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
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
    return this.smtpFrom || this.smtpUser || 'system@unknown'
  }

  /**
   * 获取传输信息
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
   */
  public getChannel(): string {
    return this.smtpSecure ? 'smtps' : 'smtp'
  }
}
