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

// 扩展 CallbackDataParams 以包含 axisValue 属性
interface TooltipCallbackDataParams extends CallbackDataParams {
  axisValue?: string | number
  axisValueLabel?: string
}

/**
 * 渲染面积图
 * - 本质是折线图 + areaStyle
 * - 支持平滑曲线、堆叠面积等配置
 * @param {ChartRenderConfig} config 图表配置
 * @param {AnalyzeConfigDao.AreaChartConfig} chartConfig 面积图特有配置
 * @returns {EChartsCoreOption | null} ECharts 配置选项
 */
export function renderAreaChart(
  config: ChartRenderConfig,
  chartConfig: AnalyzeConfigDao.AreaChartConfig
): EChartsCoreOption | null {
  const { showPoint = false, showLabel = false, smooth = true, opacity = 0.3, horizontalBar = false } = chartConfig

  // 如果没有数据，返回空配置
  if (!config.data || config.data.length === 0) {
    return null
  }

  // 处理公共数据
  const dataResult = processChartData(config)
  const { xFieldName, measureFields, seriesDimensionFieldName, useFold, xAxisTitle, yAxisTitle } = dataResult

  if (!xFieldName || !measureFields || measureFields.length === 0) {
    return null
  }

  // 处理数据
  let processedData: Array<AnalyzeDataVo.AnalyzeData>
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

  const xFieldOption = config.xAxisFields[0]
  const columnType = xFieldOption?.columnType?.toLowerCase() || ''
  const xAxisData = sortXAxisData(xAxisDataSet, columnType)

  // 构建系列数据
  const seriesMap = new Map<string, number[]>()
  const legendData: string[] = []

  const getSeriesName = (item: AnalyzeDataVo.AnalyzeData): string => {
    if (useFold && seriesDimensionFieldName) {
      const seriesDimensionValue = String(item[seriesDimensionFieldName] || '')
      const keyValue = String(item['key'] || '')
      return `${seriesDimensionValue}-${keyValue}`
    } else if (useFold) {
      return String(item['key'] || '')
    } else if (seriesDimensionFieldName) {
      return String(item[seriesDimensionFieldName] || '')
    } else {
      return measureFields[0] || 'value'
    }
  }

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
    const color = colors[index % colors.length]

    const seriesOption: LineSeriesOption = {
      name,
      type: 'line',
      data,
      smooth,
      symbol: showPoint ? 'circle' : 'none',
      symbolSize: showPoint ? 6 : 0,
      lineStyle: { width: 2 },
      areaStyle: {
        opacity,
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: color },
            { offset: 1, color: 'rgba(255,255,255,0.1)' }
          ]
        }
      }
    }

    if (showLabel) {
      seriesOption.label = {
        show: true,
        position: 'top',
        formatter: (params: CallbackDataParams) => {
          const numericValue =
            typeof params.value === 'number'
              ? params.value
              : Array.isArray(params.value)
                ? typeof params.value[0] === 'number'
                  ? params.value[0]
                  : Number(params.value[0]) || 0
                : Number(params.value) || 0
          return formatValue(numericValue, false)
        }
      }
    }

    seriesOption.itemStyle = { color }

    return seriesOption
  })

  // 构建 tooltip
  const tooltipFormatter = (params: CallbackDataParams | CallbackDataParams[]) => {
    const paramsArray = Array.isArray(params) ? params : [params]
    if (paramsArray.length === 0) return ''

    const firstParam = paramsArray[0] as TooltipCallbackDataParams
    const axisValue = firstParam.axisValue ?? firstParam.name ?? ''
    const lines: string[] = [String(axisValue)]

    for (const param of paramsArray) {
      const numericValue =
        typeof param.value === 'number'
          ? param.value
          : Array.isArray(param.value)
            ? typeof param.value[0] === 'number'
              ? param.value[0]
              : Number(param.value[0]) || 0
            : Number(param.value) || 0
      const value = formatValue(numericValue, false)
      const marker = (param as TooltipCallbackDataParams).marker || ''
      const seriesName = param.seriesName || ''
      lines.push(`${marker}${seriesName}: ${value}`)
    }

    return lines.join('<br/>')
  }

  // 构建 ECharts 配置选项
  const option: EChartsCoreOption = {
    title: {
      text: config.title || '面积图',
      left: 'center',
      top: 10,
      bottom: 10
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: tooltipFormatter
    },
    legend: {
      data: legendData,
      top: 50,
      left: 'center'
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '8%',
      top: '15%',
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel'
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
