import nodemailer, { type SentMessageInfo, type Transporter } from 'nodemailer'

export interface SendMailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>
}

/**
 * @desc 邮件服务
 */
export class EmailService {
  private transporter: Transporter<SentMessageInfo> | null = null
  private logger: Logger

  constructor() {
    this.logger = new Logger({ fileName: 'email', folderName: 'server' })
    this.createTransporter()
  }

  /**
   * @desc 创建邮件传输器
   */
  private createTransporter(): void {
    const config = useRuntimeConfig()
    const host = config.smtpHost
    const port = Number(config.smtpPort || 465)
    const secure = String(config.smtpSecure || 'true') === 'true'
    const user = config.smtpUser
    const pass = config.smtpPass

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    })
  }

  /**
   * @desc 发送邮件
   * @param options {SendMailOptions}
   * @returns {Promise<string>} messageId
   */
  public async sendMail(options: SendMailOptions): Promise<string> {
    if (!this.transporter) {
      this.createTransporter()
    }

    const config = useRuntimeConfig()
    const from = config.smtpFrom || config.smtpUser

    const result = await this.transporter!.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments
    })

    this.logger.info(`邮件已发送，messageId=${result.messageId}`)
    return result.messageId
  }
}
