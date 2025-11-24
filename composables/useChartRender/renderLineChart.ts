import type { LineSeriesOption } from 'echarts/charts'
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
 * 渲染折线图
 * @param {ChartRenderConfig} config 图表配置
 * @param {LineChartConfig} chartConfig 折线图特有配置
 * @returns {EChartsCoreOption | null} ECharts 配置选项
 */
export function renderLineChart(
  config: ChartRenderConfig,
  chartConfig: ChartConfigDao.LineChartConfig
): EChartsCoreOption | null {
  const { showPoint = false, showLabel = false, smooth = false, horizontalBar = false } = chartConfig

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
    processedData = foldData(config.data, measureFields)
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

  // 构建 ECharts 系列配置
  const colors = getDefaultChartColors()
  const series: LineSeriesOption[] = Array.from(seriesMap.entries()).map(([name, data], index) => {
    const seriesOption: LineSeriesOption = {
      name,
      type: 'line',
      data,
      smooth: smooth,
      symbol: showPoint ? 'circle' : 'none',
      symbolSize: showPoint ? 6 : 0,
      lineStyle: {
        width: 2
      }
    }

    // 标签配置
    if (showLabel) {
      seriesOption.label = {
        show: true,
        position: 'top',
        formatter: (params: any) => {
          return formatValue(params.value, false)
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

    if (paramsArray.length === 0) {
      return ''
    }

    // axisValue 是 ECharts 在 axis trigger 模式下添加的属性
    const axisValue = (paramsArray[0] as any).axisValue || paramsArray[0].name || ''
    let result = `<div style="padding: 8px; background: rgba(50, 50, 50, 0.9); color: #fff; border-radius: 4px; font-size: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
      <div style="margin-bottom: 4px; font-weight: bold; border-bottom: 1px solid rgba(255, 255, 255, 0.2); padding-bottom: 4px;">${axisValue}</div>`

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
      const value = formatValue(numericValue, false)
      result += `<div style="display: flex; align-items: center; padding: 4px 0;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${param.color || '#5470c6'}; margin-right: 8px;"></span>
            <span style="margin-right: 12px;">${param.seriesName || ''}</span>
            <span style="font-weight: bold;">${value}</span>
          </div>`
    }
    result += '</div>'
    return result
  }

  // 构建 ECharts 配置选项
  const option: EChartsCoreOption = {
    title: {
      text: config.title || '折线图',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#999',
          width: 1,
          type: 'dashed'
        }
      },
      formatter: tooltipFormatter
    },
    legend: {
      data: legendData,
      top: 30,
      left: 'center'
    },
    grid: {
      left: '3%',
      right: horizontalBar ? '15%' : '4%',
      bottom: horizontalBar ? '15%' : '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      name: xAxisTitle,
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: yAxisTitle,
      nameLocation: 'middle',
      nameGap: 40,
      axisLabel: {
        formatter: (value: number) => formatValue(value, false)
      }
    },
    dataZoom: horizontalBar
      ? [
          {
            type: 'slider',
            show: true,
            xAxisIndex: [0],
            start: 0,
            end: 100,
            bottom: 10
          }
        ]
      : undefined,
    series
  }

  return option
}
