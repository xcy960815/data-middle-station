import type { EChartsCoreOption } from 'echarts/core'

/**
 * 图表类型
 */
export type ChartType = 'interval' | 'line' | 'pie' | 'combo' | 'stacked' | 'area' | 'funnel' | 'scatter' | 'kpiCard'

/**
 * 生成空图表配置
 * @param {string} title 图表标题
 * @param {ChartType} chartType 图表类型，用于设置默认标题
 * @returns {EChartsCoreOption} 空图表配置
 */
export function createEmptyChartOption(title: string, chartType: ChartType = 'interval'): EChartsCoreOption {
  // 根据图表类型设置默认标题
  const defaultTitles: Record<ChartType, string> = {
    interval: '柱状图',
    line: '折线图',
    pie: '饼图',
    combo: '组合图',
    stacked: '堆叠图',
    area: '面积图',
    funnel: '漏斗图',
    scatter: '散点图',
    kpiCard: '指标卡'
  }

  const chartTitle = title || defaultTitles[chartType]

  // 构建 title 配置
  const titleConfig: {
    text: string
    left: string
    top: number
    bottom?: number
  } = {
    text: chartTitle,
    left: 'center',
    top: 10
  }

  // 柱状图、折线图、组合图、堆叠图、面积图、散点图需要 bottom 属性
  if (['interval', 'line', 'combo', 'stacked', 'area', 'scatter'].includes(chartType)) {
    titleConfig.bottom = 10
  }

  // 返回完整配置
  const baseOption: EChartsCoreOption = {
    title: titleConfig,
    graphic: {
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: '暂无数据',
        fontSize: 14,
        fill: '#999'
      }
    }
  }

  return baseOption
}
