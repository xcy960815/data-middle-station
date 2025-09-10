import nodemailer, { type SentMessageInfo, type Transporter } from 'nodemailer'

const logger = new Logger({ fileName: 'email', folderName: 'server' })
/**
 * @desc 邮件服务
 */
export class EmailService {
  /**
   * @desc 邮件传输器
   */
  private transporter: Transporter<SentMessageInfo> | null = null

  constructor() {
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
   * @param options {SendEmailDto.SendEmailOptions}
   * @returns {Promise<string>} messageId
   */
  public async sendMail(options: SendEmailDto.SendEmailOptions): Promise<string> {
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

    logger.info(`邮件已发送，messageId=${result.messageId}`)
    return result.messageId
  }
}
