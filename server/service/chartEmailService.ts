import { Chart } from '@antv/g2'
import { createCanvas } from 'canvas'
import { renderIntervalChart, renderLineChart, renderPieChart } from '../../composables/useChartRender'
import { AnalyseService } from './analyseService'
import { ChartDataService } from './chartDataService'
import { SendEmailService } from './sendEmailService'

const logger = new Logger({
  fileName: 'chart-email',
  folderName: 'server'
})

/**
 * 图表邮件发送服务
 */
export class ChartEmailService {
  private sendEmailService: SendEmailService
  private analyseService: AnalyseService
  private chartDataService: ChartDataService
  constructor() {
    this.sendEmailService = new SendEmailService()
    this.analyseService = new AnalyseService()
    this.chartDataService = new ChartDataService()
  }

  /**
   * 发送包含图表的邮件
   * @param options 邮件选项
   * @returns Promise<string> messageId
   */
  async sendChartEmail(options: SendEmailDto.SendChartEmailOptions): Promise<SendEmailDao.SendEmailOptions> {
    const { emailConfig, analyseOptions } = options
    const { chartType, analyseName, analyseId } = analyseOptions
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
  private async generateEmailHTML(analyseOptions: SendEmailDto.AnalyseOptions, additionalContent: string): string {
    const { analyseName, analyseId } = analyseOptions
    const analyseConfigs = await this.analyseService.getAnalyse(analyseId)
    const chartConfig = analyseConfigs.chartConfig
    const chartData = await this.chartDataService.getChartData({
      dataSource: chartConfig?.dataSource || '',
      filters: chartConfig?.filters || [],
      orders: chartConfig?.orders || [],
      groups: chartConfig?.groups || [],
      dimensions: chartConfig?.dimensions || [],
      commonChartConfig: chartConfig?.commonChartConfig
    })
    // 创建canvas和图表
    const canvas = createCanvas(800, 600)
    const chart = new Chart({
      container: canvas,
      theme: 'classic',
      autoFit: true
    })

    // 根据图表类型渲染
    let chartHTML = ''
    switch (chartConfig?.chartType) {
      case 'line':
        renderLineChart(chart, analyseOptions, chartConfig)
        break
      case 'interval':
        renderIntervalChart(chart, analyseOptions, chartConfig)
        break
      case 'pie':
        renderPieChart(chart, analyseOptions, chartConfig)
        break
    }

    // 将canvas转换为base64图片
    const imageBuffer = canvas.toBuffer('image/png')
    const base64Image = imageBuffer.toString('base64')

    chartHTML = `
      <div style="text-align: center; margin: 20px 0;">
        <h2>${analyseName}</h2>
        <img src="data:image/png;base64,${base64Image}" alt="${analyseName}" style="max-width: 100%; height: auto;" />
        ${additionalContent ? `<p>${additionalContent}</p>` : ''}
      </div>
    `

    return chartHTML
  }
}
