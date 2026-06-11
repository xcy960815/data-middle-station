import type { FunnelSeriesOption } from 'echarts/charts'
import type { EChartsCoreOption } from 'echarts/core'
import type { CallbackDataParams } from 'echarts/types/dist/shared'
import { type ChartRenderConfig, getDefaultChartColors } from './utils'

/**
 * 渲染漏斗图
 * - 一个维度 + 一个度量
 * - 按度量值降序排列，展示各阶段的转化
 * @param {ChartRenderConfig} config 图表配置
 * @param {AnalyzeConfigDao.FunnelChartConfig} chartConfig 漏斗图特有配置
 * @returns {EChartsCoreOption | null} ECharts 配置选项
 */
export function renderFunnelChart(
  config: ChartRenderConfig,
  chartConfig: AnalyzeConfigDao.FunnelChartConfig
): EChartsCoreOption | null {
  const { showLabel = true, showPercentage = true, sort = 'descending', funnelAlign = 'center' } = chartConfig

  const categoryField = config.xAxisFields[0]?.columnName
  const categoryDisplayName = config.xAxisFields[0]?.displayName
  const valueField = config.yAxisFields[0]?.columnName
  const valueDisplayName = config.yAxisFields[0]?.displayName

  if (!categoryField || !valueField || !config.data || config.data.length === 0) {
    return null
  }

  // 处理漏斗图数据
  let funnelData = config.data.map((item) => ({
    value: Number(item[valueField] || 0),
    name: String(item[categoryField] || '')
  }))

  // 排序
  if (sort === 'descending') {
    funnelData.sort((a, b) => b.value - a.value)
  } else if (sort === 'ascending') {
    funnelData.sort((a, b) => a.value - b.value)
  }

  // 计算总数（用于百分比）
  const total = funnelData.reduce((sum, item) => sum + item.value, 0)

  // 构建系列配置
  const colors = getDefaultChartColors()

  const seriesOption: FunnelSeriesOption = {
    name: categoryDisplayName || categoryField,
    type: 'funnel',
    left: '10%',
    top: 80,
    bottom: 30,
    width: '80%',
    sort,
    funnelAlign,
    gap: 2,
    label: {
      show: showLabel,
      position: 'inside',
      formatter: (params: CallbackDataParams) => {
        const name = params.name || ''
        const value = typeof params.value === 'number' ? params.value : Number(params.value) || 0
        if (showPercentage && total > 0) {
          const pct = ((value / total) * 100).toFixed(1)
          return `${name}\n${pct}%`
        }
        return `${name}\n${value.toLocaleString('zh-CN')}`
      },
      fontSize: 13
    },
    labelLine: {
      show: false
    },
    itemStyle: {
      borderColor: '#fff',
      borderWidth: 1
    },
    emphasis: {
      label: {
        fontSize: 16
      }
    },
    data: funnelData
  }

  // 构建 tooltip
  const tooltipFormatter = (params: CallbackDataParams | CallbackDataParams[]) => {
    const param = Array.isArray(params) ? params[0] : params
    if (!param) return ''

    const value = typeof param.value === 'number' ? param.value : Number(param.value) || 0
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
    const marker = (param as CallbackDataParams & { marker?: string }).marker || ''
    const name = param.name || ''

    let result = `${name}<br/>${marker}${valueDisplayName || valueField}: ${value.toLocaleString('zh-CN')}`
    if (showPercentage) {
      result += ` (${pct}%)`
    }

    // 计算转化率（相对于上一阶段）
    const currentIndex = funnelData.findIndex((d) => d.name === name)
    if (currentIndex > 0) {
      const prevValue = funnelData[currentIndex - 1].value
      if (prevValue > 0) {
        const conversionRate = ((value / prevValue) * 100).toFixed(1)
        result += `<br/>转化率: ${conversionRate}%`
      }
    }

    return result
  }

  // 构建 ECharts 配置
  const option: EChartsCoreOption = {
    title: {
      text: config.title || '漏斗图',
      left: 'center',
      top: 10,
      bottom: 10
    },
    tooltip: {
      trigger: 'item',
      formatter: tooltipFormatter
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 50,
      data: funnelData.map((item) => item.name)
    },
    color: colors,
    series: [seriesOption]
  }

  return option
}
