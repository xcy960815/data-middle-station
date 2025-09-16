import { SendEmail } from '../utils/sendEmail'
import { AnalyseService } from './analyseService'
import { ChartDataService } from './chartDataService'

const logger = new Logger({
  fileName: 'chart-email',
  folderName: 'server'
})

const sendEmail = new SendEmail()

/**
 * 图表邮件发送服务
 */
export class ChartEmailService {
  private analyseService: AnalyseService
  private chartDataService: ChartDataService

  constructor() {
    this.analyseService = new AnalyseService()
    this.chartDataService = new ChartDataService()
  }

  /**
   * 发送包含图表的邮件
   * @param options 邮件选项
   * @returns Promise<string> messageId
   */
  async sendChartEmail(options: SendEmailDto.SendChartEmailRequest): Promise<SendEmailDao.SendEmailOptions> {
    const { emailConfig, analyseOptions } = options
    const chartHTML = await this.generateEmailHTML(analyseOptions, emailConfig.additionalContent)
    // 发送邮件
    // const result = await this.sendEmailService.sendMail({
    //   emailConfig,
    //   analyseOptions,
    // })

    return {
      messageId: '123'
    }
  }

  /**
   * 生成邮件HTML内容
   * @param chart 图表数据
   * @param additionalContent 额外内容
   * @returns HTML字符串
   */
  private async generateEmailHTML(
    analyseOptions: SendEmailDto.AnalyseOptions,
    additionalContent: string
  ): Promise<string> {
    const { analyseName, analyseId } = analyseOptions
    const analyseConfigs = await this.analyseService.getAnalyse(analyseId)
    const chartConfig = analyseConfigs.chartConfig
    const chartData = await this.chartDataService.getChartData({
      dataSource: chartConfig?.dataSource || '',
      filters: chartConfig?.filters || [],
      orders: chartConfig?.orders || [],
      groups: chartConfig?.groups || [],
      dimensions: chartConfig?.dimensions || [],
      commonChartConfig: chartConfig?.commonChartConfig!
    })

    // 由于移除了 @antv/g2-ssr 包，暂时返回简单的文本内容
    // 如果需要图表功能，可以考虑使用其他图表库或重新安装 @antv/g2-ssr
    const chartHTML = `
      <div style="text-align: center; margin: 20px 0;">
        <h2>${analyseName}</h2>
        <div style="padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
          <p>图表功能暂时不可用（已移除 @antv/g2-ssr 包）</p>
          <p>图表类型: ${chartConfig?.chartType || '未知'}</p>
          <p>数据条数: ${chartData?.length || 0}</p>
        </div>
        ${additionalContent ? `<p>${additionalContent}</p>` : ''}
      </div>
    `

    return chartHTML
  }
}
