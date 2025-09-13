import type { Chart } from '@antv/g2'

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

/**
 * 渲染柱状图
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

  // 配置图表标题
  chart.title({
    title: config.title
  })

  // 维度与度量：yAxisFields 最后一个为 X 轴，其余为度量
  const xFieldName = config.yAxisFields[config.yAxisFields.length - 1].columnName
  const measureFields = config.yAxisFields
    .slice(0, config.yAxisFields.length - 1)
    .map((item) => item.columnName) as string[]

  // 可选分组（用于单度量或双层分组）
  const groupFieldName = config.xAxisFields[0]?.columnName
  const useFold = measureFields.length > 1

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

  // 轴标题（优先显示中文别名）
  const xFieldOption = config.yAxisFields[config.yAxisFields.length - 1]
  const xAxisTitle = xFieldOption?.displayName || xFieldOption?.columnComment || xFieldOption?.columnName || ''

  let yAxisTitle = ''
  if (!useFold) {
    const yFieldOption = config.yAxisFields.find((item) => item.columnName === measureFields[0])
    yAxisTitle = yFieldOption?.displayName || yFieldOption?.columnComment || yFieldOption?.columnName || ''
  }

  const yAxisOptions: { title: string; labelFormatter: string } = { title: yAxisTitle, labelFormatter: '~s' }
  chart.axis('x', { title: xAxisTitle })
  chart.axis('y', yAxisOptions)

  // 颜色与分组：
  if (useFold && groupFieldName) {
    // 双层分组：城市 × 指标
    intervalChart.encode('color', (d: ChartDataVo.ChartData) => `${d[groupFieldName]}-${d.key}`)
  } else if (useFold) {
    // 多指标分组
    intervalChart.encode('color', 'key')
  } else if (groupFieldName) {
    // 单指标，按分组字段分组
    intervalChart.encode('color', groupFieldName)
  }

  /**
   * 显示模式配置
   */
  if (displayMode === 'levelDisplay') {
    // 平级展示
    intervalChart.transform({ type: 'dodgeX' })
  } else if (displayMode === 'stackDisplay') {
    // 叠加展示
    intervalChart.transform({ type: 'stackY' })
  }

  /**
   * 是否显示百分比
   */
  if (showPercentage) {
    intervalChart.axis('y', { ...yAxisOptions, labelFormatter: (d: number) => `${Number(d) / 100}%` })
  }

  /**
   * 是否显示标题
   */
  if (showLabel) {
    intervalChart.label({
      text: useFold ? 'value' : measureFields[0],
      position: 'top'
    })
  }

  /**
   * 是否水平展示
   */
  if (horizontalDisplay) {
    intervalChart.coordinate({
      transform: [{ type: 'transpose' }]
    })
  }

  if (horizontalBar) {
    intervalChart.slider('x', true)
  }

  /**
   * 配置图表交互
   */
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
 * 渲染折线图
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

  // 配置图表标题
  chart.title({
    title: config.title
  })

  // 维度与度量：yAxisFields 最后一个为 X 轴，其余为度量
  const xFieldName = config.yAxisFields[config.yAxisFields.length - 1].columnName
  const measureFields = config.yAxisFields
    .slice(0, config.yAxisFields.length - 1)
    .map((item) => item.columnName) as string[]

  // 可选分组（用于单度量或双层分组）
  const groupFieldName = config.xAxisFields[0]?.columnName
  const useFold = measureFields.length > 1

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

  // 轴标题（优先显示中文别名）
  const xFieldOption = config.yAxisFields[config.yAxisFields.length - 1]
  const xAxisTitle = xFieldOption.displayName || xFieldOption.columnComment || xFieldOption.columnName

  let yAxisTitle = ''
  if (!useFold) {
    const yFieldOption = config.yAxisFields.find((item) => item.columnName === measureFields[0])
    yAxisTitle = yFieldOption?.displayName || yFieldOption?.columnComment || yFieldOption?.columnName || ''
  }
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

  /**
   * 是否平滑展示
   */
  if (smooth) {
    lineChart.encode('shape', 'smooth')
  }

  /**
   * 是否显示说明文字
   */
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

  /**
   * 是否开启横向滚动
   */
  if (horizontalBar) {
    lineChart.slider('x', true)
  }
}

/**
 * 渲染饼图
 * @param chart G2 图表实例
 * @param config 图表配置
 * @param chartConfig 饼图特有配置
 */
export function renderPieChart(chart: Chart, config: ChartRenderConfig, chartConfig: PieChartConfig = {}) {
  const { showLabel = false, innerRadius = 0.6 } = chartConfig

  // 配置图表标题
  chart.title({
    title: config.title
  })

  // 饼图数据处理逻辑
  // 分组字段（用于分类）：xAxisFields 第一个字段作为分类
  const categoryField = config.xAxisFields[0]?.columnName
  const categoryDisplayName = config.xAxisFields[0]?.displayName
  // 数值字段（用于计算）：yAxisFields 第一个字段作为数值
  const valueField = config.yAxisFields[0]?.columnName
  const valueDisplayName = config.yAxisFields[0]?.displayName

  if (!categoryField || !valueField) {
    // 如果没有配置字段，显示空状态
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

  // 配置tooltip
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

/**
 * 获取默认图表颜色
 */
export function getDefaultChartColors(): string[] {
  return ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E86452', '#6DC8EC', '#945FB9', '#FF9845', '#1E9493', '#FF99C3']
}
