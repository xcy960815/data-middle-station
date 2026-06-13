import { AnalyzeService } from '@/server/service/analyzeService'
import { ChartDataService } from '@/server/service/chartDataService'
import dayjs from 'dayjs'
import { BarChart, LineChart, PieChart, FunnelChart, ScatterChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import type { EChartsCoreOption } from 'echarts/core'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { renderIntervalChart } from '~/composables/useChartRender/renderIntervalChart'
import { renderLineChart } from '~/composables/useChartRender/renderLineChart'
import { renderPieChart } from '~/composables/useChartRender/renderPieChart'
import { renderStackedChart } from '~/composables/useChartRender/renderStackedChart'
import { renderComboChart } from '~/composables/useChartRender/renderComboChart'
import { renderAreaChart } from '~/composables/useChartRender/renderAreaChart'
import { renderFunnelChart } from '~/composables/useChartRender/renderFunnelChart'
import { renderScatterChart } from '~/composables/useChartRender/renderScatterChart'
import type { ChartRenderConfig } from '~/composables/useChartRender/utils'
import {
  defaultAnalyzeIntervalChartConfig,
  defaultAnalyzeLineChartConfig,
  defaultAnalyzePieChartConfig,
  defaultAnalyzeStackedChartConfig,
  defaultAnalyzeComboChartConfig,
  defaultAnalyzeAreaChartConfig,
  defaultAnalyzeFunnelChartConfig,
  defaultAnalyzeScatterChartConfig
} from '~/shared/analyzeChartConfigDefaults'
import { resolveAnalyzeDrillQueryFields } from '~/shared/analyzeDrillState'
import { validateAnalyzeChartConfig } from '~/utils/validateAnalyzeChartConfig'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  FunnelChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  SVGRenderer
])

/**
 * @desc 支持服务端渲染的图表类型列表
 * @type {readonly string[]}
 */
export const SUPPORTED_SERVER_RENDER_CHART_TYPES = [
  'line',
  'interval',
  'bar',
  'pie',
  'stacked',
  'combo',
  'area',
  'funnel',
  'scatter'
] as const

/**
 * @desc 判断图表类型是否支持服务端渲染。
 * @param {string} [chartType] 图表类型标识
 * @returns {boolean} 是否支持服务端渲染
 */
export const isServerRenderableChartType = (chartType?: string): boolean =>
  typeof chartType === 'string' &&
  SUPPORTED_SERVER_RENDER_CHART_TYPES.includes(chartType as (typeof SUPPORTED_SERVER_RENDER_CHART_TYPES)[number])

/**
 * @desc 服务端生成图表快照返回结果接口定义
 * @interface ChartSnapshotVo
 */
interface ChartSnapshotVo {
  /**
   * @desc 生成的图片二进制数据 Buffer
   * @type {Buffer}
   */
  buffer: Buffer
  /**
   * @desc 图表类型
   * @type {string}
   */
  chartType: string
  /**
   * @desc 建议的文件名
   * @type {string}
   */
  filename: string
  /**
   * @desc 分析配置的名称
   * @type {string}
   */
  analyzeName: string
}

/**
 * @desc 负责将分析配置渲染为图像快照的服务类
 * @class ChartSnapshotService
 */
export class ChartSnapshotService {
  /**
   * @desc 分析服务实例
   * @type {AnalyzeService}
   * @private
   * @readonly
   */
  private readonly analyzeService: AnalyzeService
  /**
   * @desc 图表数据服务实例
   * @type {ChartDataService}
   * @private
   * @readonly
   */
  private readonly chartDataService: ChartDataService
  /**
   * @desc 画布宽度
   * @type {number}
   * @private
   * @readonly
   */
  private readonly width: number
  /**
   * @desc 画布高度
   * @type {number}
   * @private
   * @readonly
   */
  private readonly height: number

  /**
   * @desc 初始化服务，可自定义画布尺寸
   * @param {object} [canvasOptions] 可选的画布宽高配置
   * @param {number} [canvasOptions.width] 画布宽度，默认 1200
   * @param {number} [canvasOptions.height] 画布高度，默认 720
   */
  constructor(canvasOptions?: { width?: number; height?: number }) {
    this.analyzeService = new AnalyzeService()
    this.chartDataService = new ChartDataService()
    this.width = canvasOptions?.width ?? 1200
    this.height = canvasOptions?.height ?? 720
  }

  /**
   * @desc 根据分析 ID 渲染图表并返回 SVG 缓冲
   * @param {number} analyzeId 分析记录主键
   * @returns {Promise<ChartSnapshotVo>} 返回图表快照结果
   * @throws {Error} 当未找到分析、缺少图表配置或校验失败时抛出错误
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
    const drillQueryFields = resolveAnalyzeDrillQueryFields({
      dimensions: chartConfig.dimensions || [],
      filters: chartConfig.filters || []
    })

    const validation = validateAnalyzeChartConfig({
      chartType: chartConfig.chartType,
      datasetId: chartConfig.datasetId,
      measures: chartConfig.measures || [],
      dimensions: drillQueryFields.dimensions
    })
    if (!validation.valid) {
      throw new Error(`分析 ${analyzeId} ${validation.message}`)
    }

    const analyzeData = await this.chartDataService.getAnalyzeData({
      // analyzeId 来自上方 analyzeVo 查询，此处一定非空，携带后走资源权限校验而非 admin-only 路径
      analyzeId,
      filters: drillQueryFields.filters,
      orders: chartConfig.orders || [],
      dimensions: drillQueryFields.dimensions,
      measures: chartConfig.measures,
      datasetId: chartConfig.datasetId!,
      commonChartConfig: chartConfig.commonChartConfig
    })

    const renderConfig: ChartRenderConfig = {
      title: analyzeVo.analyzeName,
      data: analyzeData,
      xAxisFields: drillQueryFields.dimensions,
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
   * @desc 根据图表类型构建对应的 ECharts 配置
   * @param {string} chartType 图表类型标识
   * @param {ChartRenderConfig} renderConfig 通用渲染配置
   * @param {AnalyzeConfigVo.PrivateChartConfigItem | null} [privateChartConfig] 私有定制配置
   * @returns {EChartsCoreOption | null} 构建的 ECharts 配置，不支持的类型则抛出错误
   * @throws {Error} 暂不支持的图表类型服务端渲染时抛出错误
   * @private
   */
  private buildChartOption(
    chartType: string,
    renderConfig: ChartRenderConfig,
    privateChartConfig?: AnalyzeConfigVo.PrivateChartConfigItem | null
  ): EChartsCoreOption | null {
    switch (chartType) {
      case 'line':
        return renderLineChart(renderConfig, privateChartConfig?.line || defaultAnalyzeLineChartConfig)
      case 'interval':
      case 'bar':
        return renderIntervalChart(renderConfig, privateChartConfig?.interval || defaultAnalyzeIntervalChartConfig)
      case 'pie':
        return renderPieChart(renderConfig, privateChartConfig?.pie || defaultAnalyzePieChartConfig)
      case 'stacked':
        return renderStackedChart(renderConfig, privateChartConfig?.stacked || defaultAnalyzeStackedChartConfig)
      case 'combo':
        return renderComboChart(renderConfig, privateChartConfig?.combo || defaultAnalyzeComboChartConfig)
      case 'area':
        return renderAreaChart(renderConfig, privateChartConfig?.area || defaultAnalyzeAreaChartConfig)
      case 'funnel':
        return renderFunnelChart(renderConfig, privateChartConfig?.funnel || defaultAnalyzeFunnelChartConfig)
      case 'scatter':
        return renderScatterChart(renderConfig, privateChartConfig?.scatter || defaultAnalyzeScatterChartConfig)
      default:
        throw new Error(`暂不支持 ${chartType} 类型的服务端渲染`)
    }
  }

  /**
   * @desc 使用 SVG 渲染器渲染 option 并输出 SVG Buffer
   * @param {EChartsCoreOption} chartOption 已生成的 ECharts 配置
   * @returns {Buffer} 渲染后的 SVG Buffer
   * @private
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
   * @desc 生成安全的文件名，包含分析名称与时间戳
   * @param {string} analyzeName 分析名称
   * @param {number} analyzeId 分析 ID，作为兜底命名
   * @returns {string} 安全的文件名，格式为 `name-timestamp.svg`
   * @private
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

/**
 * @desc 进程级单例持有的私有变量
 * @type {ChartSnapshotService | null}
 */
let chartSnapshotServiceInstance: ChartSnapshotService | null = null

/**
 * @desc 获取 ChartSnapshotService 的进程级单例
 *  - 懒加载：首次调用时才实例化（避免 import 阶段触发副作用）
 *  - 共享：所有调用方拿到的是同一个实例，避免重复 new AnalyzeService / ChartDataService
 *  - 测试场景仍可直接 `new ChartSnapshotService(customCanvasOptions)` 注入自定义实例
 * @returns {ChartSnapshotService} ChartSnapshotService 实例
 */
export const getChartSnapshotService = (): ChartSnapshotService => {
  if (!chartSnapshotServiceInstance) {
    chartSnapshotServiceInstance = new ChartSnapshotService()
  }
  return chartSnapshotServiceInstance
}
