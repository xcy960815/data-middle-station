import type { PieSeriesOption } from 'echarts/charts'
import type { EChartsCoreOption } from 'echarts/core'
import type { CallbackDataParams } from 'echarts/types/dist/shared'
import { type ChartRenderConfig, getDefaultChartColors } from './utils'

/**
 * 渲染饼图 - ECharts版本
 * @param {ChartRenderConfig} config 图表配置
 * @param {PieChartConfig} chartConfig 饼图特有配置
 * @returns {EChartsCoreOption | null} ECharts 配置选项
 */
export function renderPieChart(
  config: ChartRenderConfig,
  chartConfig: ChartConfigDao.PieChartConfig
): EChartsCoreOption | null {
  const { showLabel = false, innerRadius = 0.6, chartType = 'pie' } = chartConfig

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
      formatter: (params: any) => {
        const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0.0'
        return `${percentage}%`
      }
    }
  }

  // 构建 tooltip formatter
  const tooltipFormatter = (params: CallbackDataParams | CallbackDataParams[]) => {
    const param = Array.isArray(params) ? params[0] : params
    if (!param) return ''

    const value = typeof param.value === 'number' ? param.value : Number(param.value) || 0
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'

    return `
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.8); color: white; border-radius: 4px; font-size: 12px;">
        <div style="margin-bottom: 4px; font-weight: bold;">${param.name}</div>
        <div style="display: flex; align-items: center;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${param.color}; margin-right: 8px;"></span>
          <span style="margin-right: 8px;">${valueDisplayName || valueField}:</span>
          <span style="font-weight: bold;">${value.toLocaleString('zh-CN')}</span>
        </div>
        <div style="margin-top: 4px; color: #ccc;">占比: ${percentage}%</div>
      </div>
    `
  }

  // 构建 ECharts 配置选项
  const option: EChartsCoreOption = {
    title: {
      text: config.title || '饼图',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'item',
      formatter: tooltipFormatter
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 30,
      data: pieData.map((item) => item.name)
    },
    color: colors,
    series: [seriesOption]
  }

  return option
}
