import { AnalyzeService } from '@/server/service/analyzeService'
import { ChartDataService } from '@/server/service/chartDataService'
import dayjs from 'dayjs'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import type { EChartsCoreOption } from 'echarts/core'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { renderIntervalChart } from '~/composables/useChartRender/renderIntervalChart'
import { renderLineChart } from '~/composables/useChartRender/renderLineChart'
import { renderPieChart } from '~/composables/useChartRender/renderPieChart'
import type { ChartRenderConfig } from '~/composables/useChartRender/utils'
import { defaultIntervalChartConfig, defaultLineChartConfig, defaultPieChartConfig } from '~/shared/chartDefaults'
import { validateAnalyzeChartConfig } from '~/utils/validateAnalyzeChartConfig'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  SVGRenderer
])

export const SUPPORTED_SERVER_RENDER_CHART_TYPES = ['line', 'interval', 'bar', 'pie'] as const

/**
 * @desc 判断图表类型是否支持服务端渲染。
 */
export const isServerRenderableChartType = (chartType?: string): boolean =>
  typeof chartType === 'string' &&
  SUPPORTED_SERVER_RENDER_CHART_TYPES.includes(chartType as (typeof SUPPORTED_SERVER_RENDER_CHART_TYPES)[number])

/**
 * 服务端生成图表快照返回结果
 */
interface ChartSnapshotVo {
  buffer: Buffer
  chartType: string
  filename: string
  analyzeName: string
}

/**
 * 负责将分析配置渲染为图像快照的服务
 */
export class ChartSnapshotService {
  /**
   * 分析服务
   */
  private readonly analyzeService: AnalyzeService
  /**
   * 图表数据服务
   */
  private readonly chartDataService: ChartDataService
  /**
   * 画布宽度
   */
  private readonly width: number
  /**
   * 画布高度
   */
  private readonly height: number

  /**
   * 初始化服务，可自定义画布尺寸
   * @param canvasOptions 可选的画布宽高配置
   */
  constructor(canvasOptions?: { width?: number; height?: number }) {
    this.analyzeService = new AnalyzeService()
    this.chartDataService = new ChartDataService()
    this.width = canvasOptions?.width ?? 1200
    this.height = canvasOptions?.height ?? 720
  }

  /**
   * 根据分析 ID 渲染图表并返回 SVG 缓冲
   * @param analyzeId 分析记录主键
   */
  public async renderAnalyzeChart(analyzeId: number): Promise<ChartSnapshotVo> {
    const analyzeVo = await this.analyzeService.getAnalyze({ id: analyzeId })
    if (!analyzeVo) {
      throw new Error(`未找到分析 ${analyzeId}`)
    }

    if (!analyzeVo.chartConfig || !analyzeVo.currentConfigId) {
      throw new Error(`分析 ${analyzeId} 缺少图表配置，无法生成图像`)
    }

    const chartConfig = analyzeVo.chartConfig

    const validation = validateAnalyzeChartConfig({
      chartType: chartConfig.chartType,
      dataSource: chartConfig.dataSource,
      measures: chartConfig.measures || [],
      groups: chartConfig.groups || []
    })
    if (!validation.valid) {
      throw new Error(`分析 ${analyzeId} ${validation.message}`)
    }

    const analyzeData = await this.chartDataService.getAnalyzeData({
      filters: chartConfig.filters || [],
      orders: chartConfig.orders || [],
      groups: chartConfig.groups || [],
      measures: chartConfig.measures,
      dataSource: chartConfig.dataSource,
      commonChartConfig: chartConfig.commonChartConfig
    })

    const renderConfig: ChartRenderConfig = {
      title: analyzeVo.analyzeName,
      data: analyzeData,
      xAxisFields: chartConfig.groups || [],
      yAxisFields: chartConfig.measures
    }

    const chartOption = this.buildChartOption(chartConfig.chartType, renderConfig, chartConfig.privateChartConfig)
    if (!chartOption) {
      throw new Error(`分析 ${analyzeId} 生成图表配置失败`)
    }

    if (!chartOption.backgroundColor) {
      chartOption.backgroundColor = '#ffffff'
    }

    const snapshotBuffer = this.renderOption(chartOption)
    const snapshotVo: ChartSnapshotVo = {
      buffer: snapshotBuffer,
      chartType: chartConfig.chartType,
      filename: this.generateFilename(analyzeVo.analyzeName, analyzeId),
      analyzeName: analyzeVo.analyzeName
    }
    return snapshotVo
  }

  /**
   * 根据图表类型构建对应的 ECharts 配置
   * @param {string} chartType 图表类型标识
   * @param {ChartRenderConfig} renderConfig 通用渲染配置
   * @param {AnalyzeConfigVo.PrivateChartConfigItem | null} privateChartConfig 私有定制配置
   * @returns {EChartsCoreOption | null} 构建的 ECharts 配置
   */
  private buildChartOption(
    chartType: string,
    renderConfig: ChartRenderConfig,
    privateChartConfig?: AnalyzeConfigVo.PrivateChartConfigItem | null
  ): EChartsCoreOption | null {
    switch (chartType) {
      case 'line':
        return renderLineChart(renderConfig, privateChartConfig?.line || defaultLineChartConfig)
      case 'interval':
      case 'bar':
        return renderIntervalChart(renderConfig, privateChartConfig?.interval || defaultIntervalChartConfig)
      case 'pie':
        return renderPieChart(renderConfig, privateChartConfig?.pie || defaultPieChartConfig)
      default:
        throw new Error(`暂不支持 ${chartType} 类型的服务端渲染`)
    }
  }

  /**
   * 使用 SVG 渲染器渲染 option 并输出 SVG Buffer
   * @param {EChartsCoreOption} chartOption 已生成的 ECharts 配置
   * @returns {Buffer} 渲染后的 SVG Buffer
   */
  private renderOption(chartOption: EChartsCoreOption): Buffer {
    const chart = echarts.init(null, null, {
      renderer: 'svg',
      ssr: true,
      width: this.width,
      height: this.height
    })

    chart.setOption(chartOption, true)
    const svgStr = chart.renderToSVGString()
    chart.dispose()

    // 将 SVG 字符串转换为 Buffer
    return Buffer.from(svgStr, 'utf-8')
  }

  /**
   * 生成安全的文件名，包含分析名称与时间戳
   * @param {string} analyzeName 分析名称
   * @param {number} analyzeId 分析 ID，作为兜底命名
   * @returns {string} 安全的文件名
   */
  private generateFilename(analyzeName: string, analyzeId: number): string {
    const normalized = analyzeName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const safeName = normalized || `analyze-${analyzeId}`
    const timestamp = dayjs().format('YYYYMMDDHHmmss')
    return `${safeName}-${timestamp}.svg`
  }
}

/* ============================== 单例工厂 ============================== */

let chartSnapshotServiceInstance: ChartSnapshotService | null = null

/**
 * @desc 获取 ChartSnapshotService 的进程级单例
 *  - 懒加载：首次调用时才实例化（避免 import 阶段触发副作用）
 *  - 共享：所有调用方拿到的是同一个实例，避免重复 new AnalyzeService / ChartDataService
 *  - 测试场景仍可直接 `new ChartSnapshotService(customCanvasOptions)` 注入自定义实例
 */
export const getChartSnapshotService = (): ChartSnapshotService => {
  if (!chartSnapshotServiceInstance) {
    chartSnapshotServiceInstance = new ChartSnapshotService()
  }
  return chartSnapshotServiceInstance
}
