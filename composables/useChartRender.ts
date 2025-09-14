import type { Chart } from '@antv/g2'
// G2-SSR的Chart类型可能与G2不同，我们使用any类型来避免类型错误
// 在实际使用中，G2-SSR的API与G2基本相同，但类型定义可能不完整
type ChartSSR = any

/**
 * 图表渲染类型枚举
 */
export enum ChartRenderType {
  CLIENT = 'client', // 客户端渲染，包含交互
  SERVER = 'server' // 服务端渲染，仅数据渲染
}
/**
 * 图表渲染配置接口
 */
export interface ChartRenderConfig {
  title: string
  data: Array<ChartDataVo.ChartData>
  xAxisFields: Array<GroupStore.GroupOption>
  yAxisFields: Array<DimensionStore.DimensionOption>
}

/**
 * 通用图表渲染器接口
 */
export interface ChartRenderer {
  renderIntervalChart(chart: Chart | ChartSSR, config: ChartRenderConfig, chartConfig?: IntervalChartConfig): void
  renderLineChart(chart: Chart | ChartSSR, config: ChartRenderConfig, chartConfig?: LineChartConfig): void
  renderPieChart(chart: Chart | ChartSSR, config: ChartRenderConfig, chartConfig?: PieChartConfig): void
}

/**
 * 柱状图配置接口
 */
export interface IntervalChartConfig {
  showPercentage?: boolean
  displayMode?: string
  showLabel?: boolean
  horizontalDisplay?: boolean
  horizontalBar?: boolean
}

/**
 * 折线图配置接口
 */
export interface LineChartConfig {
  showPoint?: boolean
  showLabel?: boolean
  smooth?: boolean
  autoDualAxis?: boolean
  horizontalBar?: boolean
}

/**
 * 饼图配置接口
 */
export interface PieChartConfig {
  showLabel?: boolean
  chartType?: 'pie' | 'donut' | 'rose'
  innerRadius?: number
}

// ==================== G2 专用渲染函数（客户端，数据渲染 + 交互） ====================
//
// 使用场景：前端图表展示，包含用户交互功能
// - 支持 tooltip 悬停提示
// - 支持元素高亮
// - 支持滚动条等交互组件
// - 适用于 Vue 组件中的图表渲染
//

/**
 * 渲染柱状图 - G2版本（数据渲染 + 交互）
 * @param chart G2 图表实例
 * @param config 图表配置
 * @param chartConfig 柱状图特有配置
 */
export function renderIntervalChart(chart: Chart, config: ChartRenderConfig, chartConfig: IntervalChartConfig = {}) {
  const {
    showPercentage = false,
    displayMode = 'levelDisplay',
    showLabel = false,
    horizontalDisplay = false,
    horizontalBar = false
  } = chartConfig

  // 如果没有数据，不渲染图表
  if (!config.data || config.data.length === 0) {
    return
  }

  // 处理公共数据
  const dataResult = processChartData(config)
  const { xFieldName, measureFields, groupFieldName, useFold, xAxisTitle, yAxisTitle } = dataResult

  // 配置图表标题
  setChartTitle(chart, config.title)

  const intervalChart = chart
    .interval()
    .data({
      type: 'inline',
      value: config.data,
      transform: useFold ? [{ type: 'fold', fields: measureFields, key: 'key', value: 'value' }] : []
    })
    .encode('x', xFieldName)
    .encode('y', useFold ? 'value' : measureFields[0] || 'value')
    .scale('y', { nice: true })

  // 配置轴标题
  const yAxisOptions: { title: string; labelFormatter: string } = { title: yAxisTitle, labelFormatter: '~s' }
  chart.axis('x', { title: xAxisTitle })
  chart.axis('y', yAxisOptions)

  // 颜色与分组配置
  if (useFold && groupFieldName) {
    intervalChart.encode('color', (d: ChartDataVo.ChartData) => `${d[groupFieldName]}-${d.key}`)
  } else if (useFold) {
    intervalChart.encode('color', 'key')
  } else if (groupFieldName) {
    intervalChart.encode('color', groupFieldName)
  }

  // 显示模式配置
  if (displayMode === 'levelDisplay') {
    intervalChart.transform({ type: 'dodgeX' })
  } else if (displayMode === 'stackDisplay') {
    intervalChart.transform({ type: 'stackY' })
  }

  // 百分比显示
  if (showPercentage) {
    intervalChart.axis('y', { ...yAxisOptions, labelFormatter: (d: number) => `${Number(d) / 100}%` })
  }

  // 标签显示
  if (showLabel) {
    intervalChart.label({
      text: useFold ? 'value' : measureFields[0],
      position: 'top'
    })
  }

  // 水平展示
  if (horizontalDisplay) {
    intervalChart.coordinate({
      transform: [{ type: 'transpose' }]
    })
  }

  // 横向滚动条
  if (horizontalBar) {
    intervalChart.slider('x', true)
  }

  // 添加图表交互（仅G2客户端支持）
  addChartInteractions(chart, config, dataResult)
}

/**
 * 渲染折线图 - G2版本（数据渲染 + 交互）
 * @param chart G2 图表实例
 * @param config 图表配置
 * @param chartConfig 折线图特有配置
 */
export function renderLineChart(chart: Chart, config: ChartRenderConfig, chartConfig: LineChartConfig = {}) {
  const { showPoint = false, showLabel = false, smooth = false, horizontalBar = false } = chartConfig

  // 如果没有数据，不渲染图表
  if (!config.data || config.data.length === 0) {
    return
  }

  // 处理公共数据
  const dataResult = processChartData(config)
  const { xFieldName, measureFields, groupFieldName, useFold, xAxisTitle, yAxisTitle } = dataResult

  // 配置图表标题
  setChartTitle(chart, config.title)

  // 设置公共数据和编码
  chart
    .data({
      type: 'inline',
      value: config.data,
      transform: useFold ? [{ type: 'fold', fields: measureFields, key: 'key', value: 'value' }] : []
    })
    .encode('x', xFieldName)
    .encode('y', (row: ChartDataVo.ChartData) => {
      if (useFold) return row['value']
      return row[measureFields[0]]
    })
    .scale('y', { nice: true })

  // 配置轴标题
  const yAxisOptions: { title: string; labelFormatter: string } = { title: yAxisTitle, labelFormatter: '~s' }
  chart.axis('x', { title: xAxisTitle })
  chart.axis('y', yAxisOptions)

  // 颜色与分组编码
  if (useFold && groupFieldName) {
    const seriesEncoder = (row: ChartDataVo.ChartData) => `${String(row[groupFieldName])}-${String(row['key'])}`
    chart.encode('color', seriesEncoder).encode('series', seriesEncoder)
  } else if (useFold) {
    chart.encode('color', 'key').encode('series', 'key')
  } else if (groupFieldName) {
    chart.encode('color', groupFieldName).encode('series', groupFieldName)
  }

  // 创建线条
  const lineChart = chart.line().style('strokeWidth', 2)

  // 是否画圆点
  if (showPoint) {
    chart.point().tooltip(false)
  }

  // 是否平滑展示
  if (smooth) {
    lineChart.encode('shape', 'smooth')
  }

  // 是否显示标签
  if (showLabel) {
    lineChart.label({
      text: useFold ? 'value' : measureFields[0],
      position: 'top',
      dy: -10,
      style: {
        textAlign: 'center',
        fontSize: 12,
        fill: '#666',
        stroke: '#fff',
        strokeWidth: 2,
        strokeOpacity: 0.8
      },
      transform: [{ type: 'overlapDodgeY' }]
    })
  }

  // 是否开启横向滚动
  if (horizontalBar) {
    lineChart.slider('x', true)
  }

  // 添加图表交互（仅G2客户端支持）
  addChartInteractions(chart, config, dataResult)
}

/**
 * 渲染饼图 - G2版本（数据渲染 + 交互）
 * @param chart G2 图表实例
 * @param config 图表配置
 * @param chartConfig 饼图特有配置
 */
export function renderPieChart(chart: Chart, config: ChartRenderConfig, chartConfig: PieChartConfig = {}) {
  const { showLabel = false, innerRadius = 0.6 } = chartConfig

  // 配置图表标题
  setChartTitle(chart, config.title)

  // 饼图数据处理逻辑
  const categoryField = config.xAxisFields[0]?.columnName
  const categoryDisplayName = config.xAxisFields[0]?.displayName
  const valueField = config.yAxisFields[0]?.columnName
  const valueDisplayName = config.yAxisFields[0]?.displayName

  if (!categoryField || !valueField) {
    return
  }

  // 设置极坐标系
  chart.coordinate({
    type: 'theta',
    innerRadius
  })

  const pieChart = chart
    .interval()
    .data(config.data)
    .encode('y', valueField)
    .encode('color', categoryField)
    .scale('color', {
      range: getDefaultChartColors()
    })
    .style('stroke', '#fff')
    .style('strokeWidth', 2)

  // 配置图例
  chart.legend('color', {
    title: categoryDisplayName || categoryField
  })

  // 饼图转换
  pieChart.transform({ type: 'stackY' })

  // 标签配置
  if (showLabel) {
    pieChart.label({
      text: (d: ChartDataVo.ChartData) => {
        const value = d[valueField]
        const total = config.data.reduce(
          (sum: number, item: ChartDataVo.ChartData) => sum + Number(item[valueField] || 0),
          0
        )
        const percentage = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0'
        return `${percentage}%`
      },
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#fff'
      }
    })
  }

  // 添加饼图交互（仅G2客户端支持）
  addPieChartInteractions(chart, categoryField, valueField, valueDisplayName)
}

/**
 * 公共数据处理逻辑
 */
interface ChartDataProcessResult {
  xFieldName: string
  measureFields: string[]
  groupFieldName?: string
  useFold: boolean
  xAxisTitle: string
  yAxisTitle: string
}

/**
 * 处理图表数据配置
 */
export function processChartData(config: ChartRenderConfig): ChartDataProcessResult {
  // 维度与度量：yAxisFields 最后一个为 X 轴，其余为度量
  const xFieldName = config.yAxisFields[config.yAxisFields.length - 1].columnName
  const measureFields = config.yAxisFields
    .slice(0, config.yAxisFields.length - 1)
    .map((item) => item.columnName) as string[]

  // 可选分组（用于单度量或双层分组）
  const groupFieldName = config.xAxisFields[0]?.columnName
  const useFold = measureFields.length > 1

  // 轴标题（优先显示中文别名）
  const xFieldOption = config.yAxisFields[config.yAxisFields.length - 1]
  const xAxisTitle = xFieldOption?.displayName || xFieldOption?.columnComment || xFieldOption?.columnName || ''

  let yAxisTitle = ''
  if (!useFold) {
    const yFieldOption = config.yAxisFields.find((item) => item.columnName === measureFields[0])
    yAxisTitle = yFieldOption?.displayName || yFieldOption?.columnComment || yFieldOption?.columnName || ''
  }

  return {
    xFieldName,
    measureFields,
    groupFieldName,
    useFold,
    xAxisTitle,
    yAxisTitle
  }
}

/**
 * 配置图表标题（兼容G2和G2-SSR）
 */
export function setChartTitle(chart: Chart | ChartSSR, title: string): void {
  if ('title' in chart && typeof chart.title === 'function') {
    chart.title({ title })
  }
}

/**
 * 配置图表交互（仅适用于G2客户端）
 */
export function addChartInteractions(
  chart: Chart,
  config: ChartRenderConfig,
  dataProcessResult: ChartDataProcessResult
): void {
  const { useFold, groupFieldName, measureFields } = dataProcessResult

  chart
    .interaction('tooltip', {
      shared: true,
      // 自定义tooltip内容
      customContent: (title: string, data: ChartDataVo.ChartData[]) => {
        if (!data || data.length === 0) return ''
        const seriesFieldForTooltip = useFold ? 'key' : groupFieldName || ''
        const valueFieldForTooltip = useFold ? 'value' : measureFields[0]
        return `
        <div style="padding: 8px;">
          <div style="margin-bottom: 4px;font-weight:bold;">${title}</div>
          ${data
            .map(
              (item) => `
            <div style="display: flex; align-items: center; padding: 4px 0;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color}; margin-right: 8px;"></span>
              <span style="margin-right: 12px;">${seriesFieldForTooltip ? ((item.data as Record<string, any>)?.[seriesFieldForTooltip] ?? '') : ''}</span>
              <span style="font-weight: bold;">${(item.data as Record<string, any>)?.[valueFieldForTooltip] ?? ''}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `
      }
    })
    // 按 X 轴整列显示背景带
    .interaction('elementHighlightByX', { background: true })
    // 保留同色高亮，但不绘制背景块
    .interaction('elementHighlightByColor', { background: false })
}

/**
 * 配置饼图交互（仅适用于G2客户端）
 */
export function addPieChartInteractions(
  chart: Chart,
  categoryField: string,
  valueField: string,
  valueDisplayName?: string
): void {
  chart.interaction('tooltip', {
    shared: false,
    // 自定义tooltip内容
    customContent: (title: string, data: any[]) => {
      if (!data || data.length === 0) return ''

      // 只显示当前悬停的数据项
      const currentItem = data[0]
      if (!currentItem) return ''

      return `
        <div style="padding: 8px; background: rgba(0, 0, 0, 0.8); color: white; border-radius: 4px; font-size: 12px;">
          <div style="margin-bottom: 4px; font-weight: bold;">${currentItem.data[categoryField]}</div>
          <div style="display: flex; align-items: center;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${currentItem.color}; margin-right: 8px;"></span>
            <span style="margin-right: 8px;">${valueDisplayName || valueField}:</span>
            <span style="font-weight: bold;">${currentItem.data[valueField] ?? ''}</span>
          </div>
        </div>
      `
    }
  })
}

// ==================== G2-SSR 专用渲染函数（服务端，仅数据渲染） ====================
//
// 使用场景：服务端图表渲染，用于邮件发送等场景
// - 仅包含数据渲染逻辑，无交互功能
// - 不包含 tooltip、高亮等前端交互
// - 适用于生成静态图表图片
// - 用于邮件中的图表展示
//

/**
 * 渲染柱状图 - G2-SSR版本（仅数据渲染）
 * @param chart G2-SSR 图表实例
 * @param config 图表配置
 * @param chartConfig 柱状图特有配置
 */
export function renderIntervalChartSSR(
  chart: ChartSSR,
  config: ChartRenderConfig,
  chartConfig: IntervalChartConfig = {}
) {
  const {
    showPercentage = false,
    displayMode = 'levelDisplay',
    showLabel = false,
    horizontalDisplay = false
  } = chartConfig

  // 如果没有数据，不渲染图表
  if (!config.data || config.data.length === 0) {
    return
  }

  // 处理公共数据
  const dataResult = processChartData(config)
  const { xFieldName, measureFields, groupFieldName, useFold, xAxisTitle, yAxisTitle } = dataResult

  // 配置图表标题
  setChartTitle(chart, config.title)

  const intervalChart = chart
    .interval()
    .data({
      type: 'inline',
      value: config.data,
      transform: useFold ? [{ type: 'fold', fields: measureFields, key: 'key', value: 'value' }] : []
    })
    .encode('x', xFieldName)
    .encode('y', useFold ? 'value' : measureFields[0] || 'value')
    .scale('y', { nice: true })

  // 配置轴标题
  const yAxisOptions: { title: string; labelFormatter: string } = { title: yAxisTitle, labelFormatter: '~s' }
  chart.axis('x', { title: xAxisTitle })
  chart.axis('y', yAxisOptions)

  // 颜色与分组配置
  if (useFold && groupFieldName) {
    intervalChart.encode('color', (d: ChartDataVo.ChartData) => `${d[groupFieldName]}-${d.key}`)
  } else if (useFold) {
    intervalChart.encode('color', 'key')
  } else if (groupFieldName) {
    intervalChart.encode('color', groupFieldName)
  }

  // 显示模式配置
  if (displayMode === 'levelDisplay') {
    intervalChart.transform({ type: 'dodgeX' })
  } else if (displayMode === 'stackDisplay') {
    intervalChart.transform({ type: 'stackY' })
  }

  // 百分比显示
  if (showPercentage) {
    intervalChart.axis('y', { ...yAxisOptions, labelFormatter: (d: number) => `${Number(d) / 100}%` })
  }

  // 标签显示
  if (showLabel) {
    intervalChart.label({
      text: useFold ? 'value' : measureFields[0],
      position: 'top'
    })
  }

  // 水平展示
  if (horizontalDisplay) {
    intervalChart.coordinate({
      transform: [{ type: 'transpose' }]
    })
  }
}

/**
 * 渲染折线图 - G2-SSR版本（仅数据渲染）
 * @param chart G2-SSR 图表实例
 * @param config 图表配置
 * @param chartConfig 折线图特有配置
 */
export function renderLineChartSSR(chart: ChartSSR, config: ChartRenderConfig, chartConfig: LineChartConfig = {}) {
  const { showPoint = false, showLabel = false, smooth = false } = chartConfig

  // 如果没有数据，不渲染图表
  if (!config.data || config.data.length === 0) {
    return
  }

  // 处理公共数据
  const dataResult = processChartData(config)
  const { xFieldName, measureFields, groupFieldName, useFold, xAxisTitle, yAxisTitle } = dataResult

  // 配置图表标题
  setChartTitle(chart, config.title)

  // 设置公共数据和编码
  chart
    .data({
      type: 'inline',
      value: config.data,
      transform: useFold ? [{ type: 'fold', fields: measureFields, key: 'key', value: 'value' }] : []
    })
    .encode('x', xFieldName)
    .encode('y', (row: ChartDataVo.ChartData) => {
      if (useFold) return row['value']
      return row[measureFields[0]]
    })
    .scale('y', { nice: true })

  // 配置轴标题
  const yAxisOptions: { title: string; labelFormatter: string } = { title: yAxisTitle, labelFormatter: '~s' }
  chart.axis('x', { title: xAxisTitle })
  chart.axis('y', yAxisOptions)

  // 颜色与分组编码
  if (useFold && groupFieldName) {
    const seriesEncoder = (row: ChartDataVo.ChartData) => `${String(row[groupFieldName])}-${String(row['key'])}`
    chart.encode('color', seriesEncoder).encode('series', seriesEncoder)
  } else if (useFold) {
    chart.encode('color', 'key').encode('series', 'key')
  } else if (groupFieldName) {
    chart.encode('color', groupFieldName).encode('series', groupFieldName)
  }

  // 创建线条
  const lineChart = chart.line().style('strokeWidth', 2)

  // 是否画圆点
  if (showPoint) {
    chart.point().tooltip(false)
  }

  // 是否平滑展示
  if (smooth) {
    lineChart.encode('shape', 'smooth')
  }

  // 是否显示标签
  if (showLabel) {
    lineChart.label({
      text: useFold ? 'value' : measureFields[0],
      position: 'top',
      dy: -10,
      style: {
        textAlign: 'center',
        fontSize: 12,
        fill: '#666',
        stroke: '#fff',
        strokeWidth: 2,
        strokeOpacity: 0.8
      },
      transform: [{ type: 'overlapDodgeY' }]
    })
  }
}

/**
 * 渲染饼图 - G2-SSR版本（仅数据渲染）
 * @param chart G2-SSR 图表实例
 * @param config 图表配置
 * @param chartConfig 饼图特有配置
 */
export function renderPieChartSSR(chart: ChartSSR, config: ChartRenderConfig, chartConfig: PieChartConfig = {}) {
  const { showLabel = false, innerRadius = 0.6 } = chartConfig

  // 配置图表标题
  setChartTitle(chart, config.title)

  // 饼图数据处理逻辑
  const categoryField = config.xAxisFields[0]?.columnName
  const categoryDisplayName = config.xAxisFields[0]?.displayName
  const valueField = config.yAxisFields[0]?.columnName
  const valueDisplayName = config.yAxisFields[0]?.displayName

  if (!categoryField || !valueField) {
    return
  }

  // 设置极坐标系
  chart.coordinate({
    type: 'theta',
    innerRadius
  })

  const pieChart = chart
    .interval()
    .data(config.data)
    .encode('y', valueField)
    .encode('color', categoryField)
    .scale('color', {
      range: getDefaultChartColors()
    })
    .style('stroke', '#fff')
    .style('strokeWidth', 2)

  // 配置图例
  chart.legend('color', {
    title: categoryDisplayName || categoryField
  })

  // 饼图转换
  pieChart.transform({ type: 'stackY' })

  // 标签配置
  if (showLabel) {
    pieChart.label({
      text: (d: ChartDataVo.ChartData) => {
        const value = d[valueField]
        const total = config.data.reduce(
          (sum: number, item: ChartDataVo.ChartData) => sum + Number(item[valueField] || 0),
          0
        )
        const percentage = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0'
        return `${percentage}%`
      },
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#fff'
      }
    })
  }
}

/**
 * 获取默认图表颜色
 */
export function getDefaultChartColors(): string[] {
  return ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E86452', '#6DC8EC', '#945FB9', '#FF9845', '#1E9493', '#FF99C3']
}
