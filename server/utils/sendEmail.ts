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
   * @returns {Promise<SendEmailVo.SendEmailResponse>} messageId
   */
  public async sendMail(options: SendEmailDto.SendChartEmailRequest): Promise<SendEmailVo.SendEmailResponse> {
    if (!this.transporter) {
      this.createTransporter()
    }

    // 构建附件配置
    const attachments = this.buildAttachments(options.analyseOptions)

    const result = await this.transporter!.sendMail({
      from: this.smtpFrom || this.smtpUser!,
      to: options.emailConfig.to,
      subject: options.emailConfig.subject,
      html: this.buildEmailContent(options.emailConfig, options.analyseOptions),
      attachments
    })

    logger.info(`邮件已发送，messageId=${result.messageId}，收件人=${options.emailConfig.to}`)

    return {
      messageId: result.messageId
    }
  }

  /**
   * @desc 构建附件配置
   * @param analyseOptions {SendEmailDto.AnalyseOptions}
   * @returns {Array}
   */
  private buildAttachments(analyseOptions: SendEmailDto.AnalyseOptions): Array<any> {
    if (!analyseOptions.filename) {
      return []
    }

    const attachment: any = {
      filename: analyseOptions.filename,
      contentType: 'image/png'
    }

    // 优先使用文件内容
    if (analyseOptions.fileContent) {
      attachment.content = analyseOptions.fileContent
    } else if (analyseOptions.filePath) {
      attachment.path = analyseOptions.filePath
    } else {
      // 如果既没有内容也没有路径，记录警告但不添加附件
      logger.warn(`邮件附件 ${analyseOptions.filename} 缺少内容或路径，将跳过附件`)
      return []
    }

    return [attachment]
  }

  /**
   * @desc 构建邮件内容
   * @param emailConfig {SendEmailDto.EmailConfig}
   * @param analyseOptions {SendEmailDto.AnalyseOptions}
   * @returns {string}
   */
  private buildEmailContent(
    emailConfig: SendEmailDto.EmailConfig,
    analyseOptions: SendEmailDto.AnalyseOptions
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
              <p style="margin: 5px 0;"><strong>图表标题:</strong> ${analyseOptions.analyseName}</p>
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
}
