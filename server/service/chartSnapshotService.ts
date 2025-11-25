import dayjs from 'dayjs'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import type { EChartsCoreOption } from 'echarts/core'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { renderIntervalChart } from '~/composables/useChartRender/renderIntervalChart'
import { renderLineChart } from '~/composables/useChartRender/renderLineChart'
import { renderPieChart } from '~/composables/useChartRender/renderPieChart'
import type { ChartRenderConfig } from '~/composables/useChartRender/utils'
import { defaultIntervalChartConfig, defaultLineChartConfig, defaultPieChartConfig } from '~/shared/chartDefaults'
import { AnalyzeService } from '@/server/service/analyzeService'
import { ChartDataService } from '@/server/service/chartDataService'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  SVGRenderer
])

/**
 * 服务端生成图表快照返回结果
 */
interface ChartSnapshotResult {
  buffer: Buffer
  chartType: string
  filename: string
  analyzeName: string
}

/**
 * 负责将分析配置渲染为图像快照的服务
 */
export class ChartSnapshotService {
  private readonly analyzeService: AnalyzeService
  private readonly chartDataService: ChartDataService
  private readonly width: number
  private readonly height: number

  /**
   * 初始化服务，可自定义画布尺寸
   * @param options 可选的画布宽高配置
   */
  constructor(options?: { width?: number; height?: number }) {
    this.analyzeService = new AnalyzeService()
    this.chartDataService = new ChartDataService()
    this.width = options?.width ?? 1200
    this.height = options?.height ?? 720
  }

  /**
   * 根据分析 ID 渲染图表并返回 SVG 缓冲
   * @param analyzeId 分析记录主键
   */
  public async renderAnalyzeChart(analyzeId: number): Promise<ChartSnapshotResult> {
    const analyze = await this.analyzeService.getAnalyze({ id: analyzeId })
    if (!analyze) {
      throw new Error(`未找到分析 ${analyzeId}`)
    }

    if (!analyze.chartConfig || !analyze.chartConfigId) {
      throw new Error(`分析 ${analyzeId} 缺少图表配置，无法生成图像`)
    }

    const chartConfig = analyze.chartConfig

    if (!chartConfig.dataSource) {
      throw new Error(`分析 ${analyzeId} 缺少数据源配置`)
    }

    if (!chartConfig.dimensions || chartConfig.dimensions.length === 0) {
      throw new Error(`分析 ${analyzeId} 缺少维度配置`)
    }

    const chartData = await this.chartDataService.getChartData({
      filters: chartConfig.filters || [],
      orders: chartConfig.orders || [],
      groups: chartConfig.groups || [],
      dimensions: chartConfig.dimensions,
      dataSource: chartConfig.dataSource,
      commonChartConfig: chartConfig.commonChartConfig
    })

    const renderConfig: ChartRenderConfig = {
      title: analyze.analyzeName,
      data: chartData,
      xAxisFields: chartConfig.groups || [],
      yAxisFields: chartConfig.dimensions
    }

    const option = this.buildChartOption(chartConfig.chartType, renderConfig, chartConfig.privateChartConfig)
    if (!option) {
      throw new Error(`分析 ${analyzeId} 生成图表配置失败`)
    }

    if (!option.backgroundColor) {
      option.backgroundColor = '#ffffff'
    }

    const buffer = this.renderOption(option)

    return {
      buffer,
      chartType: chartConfig.chartType,
      filename: this.generateFilename(analyze.analyzeName, analyzeId),
      analyzeName: analyze.analyzeName
    }
  }

  /**
   * 根据图表类型构建对应的 ECharts 配置
   * @param chartType 图表类型标识
   * @param config 通用渲染配置
   * @param privateChartConfig 私有定制配置
   */
  private buildChartOption(
    chartType: string,
    config: ChartRenderConfig,
    privateChartConfig?: ChartConfigVo.PrivateChartConfigResponse | null
  ): EChartsCoreOption | null {
    switch (chartType) {
      case 'line':
        return renderLineChart(config, privateChartConfig?.line || defaultLineChartConfig)
      case 'interval':
      case 'bar':
        return renderIntervalChart(config, privateChartConfig?.interval || defaultIntervalChartConfig)
      case 'pie':
        return renderPieChart(config, privateChartConfig?.pie || defaultPieChartConfig)
      default:
        throw new Error(`暂不支持 ${chartType} 类型的服务端渲染`)
    }
  }

  /**
   * 使用 SVG 渲染器渲染 option 并输出 SVG Buffer
   * @param option 已生成的 ECharts 配置
   */
  private renderOption(option: EChartsCoreOption): Buffer {
    const chart = echarts.init(null, null, {
      renderer: 'svg',
      ssr: true,
      width: this.width,
      height: this.height
    })

    chart.setOption(option, true)
    const svgStr = chart.renderToSVGString()
    chart.dispose()

    // 将 SVG 字符串转换为 Buffer
    return Buffer.from(svgStr, 'utf-8')
  }

  /**
   * 生成安全的文件名，包含分析名称与时间戳
   * @param name 分析名称
   * @param analyzeId 分析 ID，作为兜底命名
   */
  private generateFilename(name: string, analyzeId: number): string {
    const normalized = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const safeName = normalized || `analyze-${analyzeId}`
    const timestamp = dayjs().format('YYYYMMDDHHmmss')
    return `${safeName}-${timestamp}.svg`
  }
}
