import type { PieSeriesOption } from 'echarts/charts'
import type { EChartsCoreOption } from 'echarts/core'
import type { CallbackDataParams } from 'echarts/types/dist/shared'
import { type ChartRenderConfig, getDefaultChartColors } from './utils'

/**
 * 渲染饼图
 * @param {ChartRenderConfig} config 图表配置
 * @param {PieChartConfig} chartConfig 饼图特有配置
 * @returns {EChartsCoreOption | null} ECharts 配置选项
 */
export function renderPieChart(
  config: ChartRenderConfig,
  chartConfig: AnalyzeConfigDao.PieChartConfig
): EChartsCoreOption | null {
  const { showLabel = false, chartType = 'pie' } = chartConfig

  // 饼图数据处理逻辑
  const categoryField = config.xAxisFields[0]?.columnName
  const categoryDisplayName = config.xAxisFields[0]?.displayName
  const valueField = config.yAxisFields[0]?.columnName
  const valueDisplayName = config.yAxisFields[0]?.displayName

  if (!categoryField || !valueField || !config.data || config.data.length === 0) {
    return null
  }

  // 处理饼图数据
  const pieData = config.data.map((item) => {
    const value = Number(item[valueField] || 0)
    const name = String(item[categoryField] || '')
    return { value, name }
  })

  // 计算总数（用于百分比显示）
  const total = pieData.reduce((sum, item) => sum + item.value, 0)

  // 构建 ECharts 系列配置
  const colors = getDefaultChartColors()
  const seriesOption: PieSeriesOption = {
    name: categoryDisplayName || categoryField,
    type: 'pie',
    radius: chartType === 'rose' ? [0, '70%'] : '70%',
    data: pieData,
    roseType: chartType === 'rose' ? 'area' : undefined,
    itemStyle: {
      borderColor: '#fff',
      borderWidth: 2
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }

  // 标签配置
  if (showLabel) {
    seriesOption.label = {
      show: true,
      formatter: (params: CallbackDataParams) => {
        // params.value 可能是多种类型，需要转换为数字
        const numericValue =
          typeof params.value === 'number'
            ? params.value
            : Array.isArray(params.value)
              ? typeof params.value[0] === 'number'
                ? params.value[0]
                : Number(params.value[0]) || 0
              : Number(params.value) || 0
        const percentage = total > 0 ? ((numericValue / total) * 100).toFixed(1) : '0.0'
        return `${percentage}%`
      }
    }
  }

  /**
   * 构建 tooltip formatter
   * @param {CallbackDataParams | CallbackDataParams[]} params 回调数据参数
   * @returns {string} 格式化后的 tooltip 内容
   */
  const tooltipFormatter = (params: CallbackDataParams | CallbackDataParams[]) => {
    const param = Array.isArray(params) ? params[0] : params
    if (!param) return ''

    const value = typeof param.value === 'number' ? param.value : Number(param.value) || 0
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
    const marker = (param as CallbackDataParams & { marker?: string }).marker || ''
    const valueLabel = param.seriesName || valueDisplayName || valueField
    const name = param.name ? `${param.name}` : ''

    return `${name}<br/>${marker}${valueLabel}: ${value.toLocaleString('zh-CN')} (${percentage}%)`
  }

  // 构建 ECharts 配置选项
  const option: EChartsCoreOption = {
    title: {
      text: config.title || '饼图',
      left: 'center',
      top: 10,
      bottom: 10
    },
    tooltip: {
      trigger: 'item',
      axisPointer: {
        type: 'shadow'
      },
      formatter: tooltipFormatter
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 50,
      data: pieData.map((item) => item.name)
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '8%',
      top: '15%',
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel'
    },
    color: colors,
    series: [seriesOption]
  }

  return option
}
