import { createChart } from '@antv/g2-ssr'
import { renderIntervalChartSSR, renderLineChartSSR, renderPieChartSSR } from '~/composables/useChartRender'
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
    const chart = await createChart({
      width: 640,
      height: 480,
      imageType: 'jpeg'
    })

    // 构造图表渲染配置
    const chartRenderConfig = {
      title: analyseOptions.analyseName,
      data: chartData,
      xAxisFields: chartConfig?.groups || [],
      yAxisFields: chartConfig?.dimensions || []
    }

    switch (chartConfig?.chartType) {
      case 'line':
        renderLineChartSSR(chart, chartRenderConfig, chartConfig.privateChartConfig?.line)
        break
      case 'interval':
        renderIntervalChartSSR(chart, chartRenderConfig, chartConfig.privateChartConfig?.interval)
        break
      case 'pie':
        renderPieChartSSR(chart, chartRenderConfig, chartConfig.privateChartConfig?.pie)
        break
    }

    // 导出
    chart.exportToFile('chart')
    // -> chart.png

    const base64Image = chart.toBuffer()

    // chartHTML = `
    //   <div style="text-align: center; margin: 20px 0;">
    //     <h2>${analyseName}</h2>
    //     <img src="data:image/png;base64,${base64Image}" alt="${analyseName}" style="max-width: 100%; height: auto;" />
    //     ${additionalContent ? `<p>${additionalContent}</p>` : ''}
    //   </div>
    // `

    const chartHTML = `
      <div style="text-align: center; margin: 20px 0;">
        <h2>${analyseName}</h2>
        <img src="data:image/png;base64,${base64Image}" alt="${analyseName}" style="max-width: 100%; height: auto;" />
        ${additionalContent ? `<p>${additionalContent}</p>` : ''}
      </div>
    `
    console.log('chartHTML', chartHTML)
    return chartHTML
  }
}
