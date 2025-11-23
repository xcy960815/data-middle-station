import type { BarSeriesOption } from 'echarts/charts'
import type { EChartsCoreOption } from 'echarts/core'
import type { CallbackDataParams } from 'echarts/types/dist/shared'
import {
  type ChartRenderConfig,
  foldData,
  formatValue,
  getDefaultChartColors,
  processChartData,
  sortXAxisData
} from './utils'

/**
 * 渲染柱状图 - ECharts版本
 * @param {ChartRenderConfig} config 图表配置
 * @param {ChartConfigDao.IntervalChartConfig} chartConfig 柱状图特有配置
 * @returns {EChartsCoreOption | null} ECharts 配置选项
 */
export function renderIntervalChart(
  config: ChartRenderConfig,
  chartConfig: IntervalChartConfig = {}
): EChartsCoreOption | null {
  const {
    showPercentage = false,
    displayMode = 'levelDisplay',
    showLabel = false,
    horizontalDisplay = false,
    horizontalBar = false
  } = chartConfig

  // 如果没有数据，返回空配置
  if (!config.data || config.data.length === 0) {
    return null
  }

  // 处理公共数据
  const dataResult = processChartData(config)

  const { xFieldName, measureFields, groupFieldName, useFold, xAxisTitle, yAxisTitle } = dataResult

  // 检查 measureFields 是否为空
  if (!measureFields || measureFields.length === 0) {
    return null
  }

  // 处理数据
  let processedData: Array<ChartDataVo.ChartData>
  if (useFold) {
    processedData = foldData(config.data, measureFields, xFieldName, groupFieldName)
  } else {
    processedData = config.data
  }

  // 获取 X 轴数据（去重并排序）
  const xAxisDataSet = new Set<string>()
  for (const item of processedData) {
    const xValue = String(item[xFieldName] || '')
    if (xValue) {
      xAxisDataSet.add(xValue)
    }
  }

  // 获取x轴字段的类型信息
  const xFieldOption = config.yAxisFields[config.yAxisFields.length - 1]
  const columnType = xFieldOption?.columnType?.toLowerCase() || ''

  // 根据字段类型进行排序
  const xAxisData = sortXAxisData(xAxisDataSet, columnType)

  // 构建系列数据
  const seriesMap = new Map<string, number[]>()
  const legendData: string[] = []

  // 确定系列名称的生成逻辑
  const getSeriesName = (item: ChartDataVo.ChartData): string => {
    if (useFold && groupFieldName) {
      const groupValue = String(item[groupFieldName] || '')
      const keyValue = String(item['key'] || '')
      return `${groupValue}-${keyValue}`
    } else if (useFold) {
      return String(item['key'] || '')
    } else if (groupFieldName) {
      return String(item[groupFieldName] || '')
    } else {
      return measureFields[0] || 'value'
    }
  }

  // 填充系列数据
  for (const item of processedData) {
    const seriesName = getSeriesName(item)
    const xValue = String(item[xFieldName] || '')
    const value = useFold ? Number(item['value'] || 0) : Number(item[measureFields[0]] || 0)

    if (!seriesMap.has(seriesName)) {
      seriesMap.set(seriesName, new Array(xAxisData.length).fill(0))
      legendData.push(seriesName)
    }

    const index = xAxisData.indexOf(xValue)
    if (index >= 0) {
      const seriesData = seriesMap.get(seriesName)!
      seriesData[index] = value
    }
  }

  // 如果是百分比显示，需要计算百分比
  if (showPercentage && displayMode === 'stackDisplay') {
    // 计算每个 x 轴位置的总和
    const totals = new Array(xAxisData.length).fill(0)
    for (const seriesData of seriesMap.values()) {
      for (let i = 0; i < seriesData.length; i++) {
        totals[i] += seriesData[i]
      }
    }

    // 转换为百分比
    for (const [seriesName, seriesData] of seriesMap.entries()) {
      for (let i = 0; i < seriesData.length; i++) {
        if (totals[i] > 0) {
          seriesData[i] = (seriesData[i] / totals[i]) * 100
        }
      }
    }
  }

  // 构建 ECharts 系列配置
  const colors = getDefaultChartColors()
  const series: BarSeriesOption[] = Array.from(seriesMap.entries()).map(([name, data], index) => {
    const seriesOption: BarSeriesOption = {
      name,
      type: 'bar',
      data,
      stack: displayMode === 'stackDisplay' ? 'stack' : undefined
    }

    // 标签配置
    if (showLabel) {
      seriesOption.label = {
        show: true,
        position: horizontalDisplay ? 'right' : 'top',
        formatter: (params: any) => {
          return formatValue(params.value, showPercentage)
        }
      }
    }

    // 颜色配置
    seriesOption.itemStyle = {
      color: colors[index % colors.length]
    }

    return seriesOption
  })

  // 构建 tooltip formatter
  const tooltipFormatter = (params: CallbackDataParams | CallbackDataParams[]) => {
    // 当 trigger 为 'axis' 时，params 是数组
    const paramsArray = Array.isArray(params) ? params : [params]

    if (paramsArray.length > 0) {
      // axisValue 是 ECharts 在 axis trigger 模式下添加的属性
      const axisValue = (paramsArray[0] as any).axisValue || paramsArray[0].name
      let result = `<div style="padding: 8px;"><div style="margin-bottom: 4px; font-weight: bold;">${axisValue}</div>`

      for (const param of paramsArray) {
        // param.value 可能是多种类型，需要转换为数字
        const numericValue =
          typeof param.value === 'number'
            ? param.value
            : Array.isArray(param.value)
              ? typeof param.value[0] === 'number'
                ? param.value[0]
                : Number(param.value[0]) || 0
              : Number(param.value) || 0
        const value = formatValue(numericValue, showPercentage)
        result += `<div style="display: flex; align-items: center; padding: 4px 0;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${param.color}; margin-right: 8px;"></span>
              <span style="margin-right: 12px;">${param.seriesName}</span>
              <span style="font-weight: bold;">${value}</span>
            </div>`
      }
      result += '</div>'
      return result
    }
    return ''
  }

  // 构建 ECharts 配置选项
  const option: EChartsCoreOption = {
    title: {
      text: config.title || '柱状图',
      left: 'center',
      top: 10,
      bottom: 10
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: tooltipFormatter
    },
    legend: {
      data: legendData,
      top: 40,
      left: 'center'
    },
    grid: {
      left: '3%',
      right: horizontalBar && horizontalDisplay ? '15%' : '4%',
      bottom: horizontalBar && !horizontalDisplay ? '15%' : horizontalDisplay ? '3%' : xAxisTitle ? '20%' : '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: horizontalDisplay ? 'value' : 'category',
      data: horizontalDisplay ? undefined : xAxisData,
      name: horizontalDisplay ? yAxisTitle : xAxisTitle,
      nameLocation: 'middle',
      nameGap: horizontalDisplay ? 50 : 30,
      axisLabel: {
        formatter: horizontalDisplay ? (value: number) => formatValue(value, showPercentage) : undefined
      }
    },
    yAxis: {
      type: horizontalDisplay ? 'category' : 'value',
      data: horizontalDisplay ? xAxisData : undefined,
      name: horizontalDisplay ? xAxisTitle : yAxisTitle,
      nameLocation: 'middle',
      nameGap: horizontalDisplay ? 50 : 40,
      axisLabel: {
        formatter: !horizontalDisplay ? (value: number) => formatValue(value, showPercentage) : undefined
      }
    },
    dataZoom: horizontalBar
      ? [
          {
            type: 'slider',
            show: true,
            [horizontalDisplay ? 'yAxisIndex' : 'xAxisIndex']: [0],
            start: 0,
            end: 100,
            [horizontalDisplay ? 'right' : 'bottom']: 10
          }
        ]
      : undefined,
    series
  }

  return option
}
