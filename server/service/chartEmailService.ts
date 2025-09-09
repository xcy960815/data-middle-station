import type { ChartEmailExportData } from '~/utils/chart-export'
import { EmailService } from './emailService'

export interface ChartEmailOptions {
  to: string | string[]
  subject: string
  chart: ChartEmailExportData
  additionalContent?: string
  cc?: string | string[]
  bcc?: string | string[]
}

const logger = new Logger({
  fileName: 'chart-email',
  folderName: 'server'
})

/**
 * 图表邮件发送服务
 */
export class ChartEmailService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  /**
   * 发送包含图表的邮件
   * @param options 邮件选项
   * @returns Promise<string> messageId
   */
  async sendChartEmail(options: ChartEmailOptions): Promise<string> {
    const { to, subject, additionalContent = '', cc, bcc, chart } = options

    try {
      // 生成邮件HTML内容
      const htmlContent = this.generateEmailHTML(chart, additionalContent)

      // 准备附件
      const attachment = {
        filename: `${chart.filename}.png`,
        content: this.base64ToBuffer(chart.base64Image),
        contentType: 'image/png',
        cid: chart.chartId // 用于在HTML中引用
      }

      // 发送邮件
      const messageId = await this.emailService.sendMail({
        to,
        subject,
        html: htmlContent,
        attachments: [attachment],
        cc,
        bcc
      })

      logger.info(`图表邮件发送成功，messageId=${messageId}，图表标题：${chart.title}`)
      return messageId
    } catch (error: any) {
      logger.error('图表邮件发送失败:' + error + ' ' + error.message)
      throw new Error(`图表邮件发送失败: ${error}`)
    }
  }

  /**
   * 生成邮件HTML内容
   * @param chart 图表数据
   * @param additionalContent 额外内容
   * @returns HTML字符串
   */
  private generateEmailHTML(chart: ChartEmailExportData, additionalContent: string): string {
    const chartHTML = `
      <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px; background-color: #fafafa;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">${chart.title}</h3>
        <div style="text-align: center;">
          <img src="cid:${chart.chartId}" alt="${chart.title}" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
        </div>
      </div>
    `

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>数据分析报告</title>
      </head>
      <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff;">

        <!-- 邮件头部 -->
        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📊 数据分析报告</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>

        <!-- 额外内容 -->
        ${
          additionalContent
            ? `
          <div style="margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
            <div style="font-size: 16px; line-height: 1.8;">${additionalContent}</div>
          </div>
        `
            : ''
        }

        <!-- 图表内容 -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px;">📈 图表分析</h2>
          ${chartHTML}
        </div>

        <!-- 邮件底部 -->
        <div style="text-align: center; margin-top: 40px; padding: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px;">
          <p style="margin: 0;">此邮件由数据中台系统自动生成</p>
          <p style="margin: 5px 0 0 0;">如有疑问，请联系系统管理员</p>
        </div>

      </body>
      </html>
    `
  }

  /**
   * 将Base64字符串转换为Buffer
   * @param base64String Base64字符串
   * @returns Buffer
   */
  private base64ToBuffer(base64String: string): Buffer {
    // 移除 data:image/png;base64, 前缀（如果存在）
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
    return Buffer.from(base64Data, 'base64')
  }

  /**
   * 生成定时报告邮件
   * @param reportData 报告数据
   * @returns Promise<string>
   */
  async sendScheduledReport(reportData: {
    recipient: string | string[]
    reportTitle: string
    chart: ChartEmailExportData
    summary?: string
    period?: string
  }): Promise<string> {
    const { recipient, reportTitle, chart, summary = '', period = '每日' } = reportData

    const subject = `${period}数据报告 - ${reportTitle} (${new Date().toLocaleDateString('zh-CN')})`

    const additionalContent = summary
      ? `
      <h3 style="color: #333; margin-bottom: 15px;">📋 报告摘要</h3>
      <p style="font-size: 16px; line-height: 1.8; color: #555;">${summary}</p>
    `
      : ''

    return this.sendChartEmail({
      to: recipient,
      subject,
      chart,
      additionalContent
    })
  }
}
