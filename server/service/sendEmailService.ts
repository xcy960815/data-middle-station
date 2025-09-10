import nodemailer, { type Transporter } from 'nodemailer'

const logger = new Logger({ fileName: 'email', folderName: 'server' })

/**
 * @desc 邮件服务
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

  constructor() {
    this.smtpHost = useRuntimeConfig().smtpHost
    this.smtpPort = useRuntimeConfig().smtpPort ? Number(useRuntimeConfig().smtpPort) : 465
    this.smtpSecure = String(useRuntimeConfig().smtpSecure || 'true') === 'true'
    this.smtpUser = useRuntimeConfig().smtpUser
    this.smtpPass = useRuntimeConfig().smtpPass
    this.smtpFrom = useRuntimeConfig().smtpFrom
    this.createTransporter()
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
   * @param options {SendEmailDto.SendEmailOptions}
   * @returns {Promise<string>} messageId
   */
  public async sendMail(options: SendEmailDto.SendEmailOptions): Promise<SendEmailVo.SendEmailOptions> {
    if (!this.transporter) {
      this.createTransporter()
    }
    const result = await this.transporter!.sendMail({
      from: this.smtpFrom || this.smtpUser!,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments
    })

    logger.info(`邮件已发送，messageId=${result.messageId}`)

    return result
  }
}
