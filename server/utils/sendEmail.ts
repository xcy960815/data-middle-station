import nodemailer, { type Transporter } from 'nodemailer'

const logger = new Logger({ fileName: 'email', folderName: 'server' })

/**
 * @desc 发送邮件服务
 */
export class SendEmail {
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
   * @param options {SendEmailDto.SendChartEmailRequest}
   * @returns {Promise<SendEmailVo.SendEmailOptions>} messageId
   */
  public async sendMail(options: SendEmailDto.SendChartEmailRequest): Promise<SendEmailVo.SendEmailOptions> {
    if (!this.transporter) {
      this.createTransporter()
    }
    const result = {
      messageId: '123'
    }
    // const result = await this.transporter!.sendMail({
    //   from: this.smtpFrom || this.smtpUser!,
    //   to: options.emailConfig.to,
    //   subject: options.emailConfig.subject,
    //   attachments: [
    //     {
    //       filename: options.analyseOptions.filename,
    //       contentType: 'image/png'
    //     }
    //   ]
    // })

    // logger.info(`邮件已发送，messageId=${result.messageId}`)

    return result
  }
}
