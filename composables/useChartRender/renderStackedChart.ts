import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
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
 * 渲染堆叠图（支持堆叠柱状图和堆叠面积图）
 * - displayMode: 'stackBar' → 堆叠柱状图
 * - displayMode: 'stackArea' → 堆叠面积图
 * - showPercentage: 百分比堆叠
 * @param {ChartRenderConfig} config 图表配置
 * @param {AnalyzeConfigDao.StackedChartConfig} chartConfig 堆叠图特有配置
 * @returns {EChartsCoreOption | null} ECharts 配置选项
 */
export function renderStackedChart(
  config: ChartRenderConfig,
  chartConfig: AnalyzeConfigDao.StackedChartConfig
): EChartsCoreOption | null {
  const {
    displayMode = 'stackBar',
    showPercentage = false,
    showLabel = false,
    smooth = false,
    horizontalBar = false
  } = chartConfig

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

  // 百分比堆叠处理
  if (showPercentage) {
    const totals = new Array(xAxisData.length).fill(0)
    for (const seriesData of seriesMap.values()) {
      for (let i = 0; i < seriesData.length; i++) {
        totals[i] += seriesData[i]
      }
    }
    for (const seriesData of seriesMap.values()) {
      for (let i = 0; i < seriesData.length; i++) {
        if (totals[i] > 0) {
          seriesData[i] = (seriesData[i] / totals[i]) * 100
        }
      }
    }
  }

  // 根据 displayMode 构建不同类型的系列
  const colors = getDefaultChartColors()
  const isAreaMode = displayMode === 'stackArea'

  const series: (BarSeriesOption | LineSeriesOption)[] = Array.from(seriesMap.entries()).map(([name, data], index) => {
    if (isAreaMode) {
      // 堆叠面积图
      const seriesOption: LineSeriesOption = {
        name,
        type: 'line',
        data,
        stack: 'stack',
        smooth,
        areaStyle: {
          opacity: 0.6
        },
        symbol: 'none',
        lineStyle: { width: 1 },
        // focus: 'none' 禁用 hover 时其他 series 变灰的 blur 效果
        emphasis: {
          focus: 'none',
          areaStyle: { opacity: 0.8 }
        },
        blur: {
          areaStyle: { opacity: 0.6 },
          lineStyle: { opacity: 1 }
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
            return formatValue(numericValue, showPercentage)
          }
        }
      }

      seriesOption.itemStyle = {
        color: colors[index % colors.length]
      }

      return seriesOption
    } else {
      // 堆叠柱状图
      const seriesOption: BarSeriesOption = {
        name,
        type: 'bar',
        data,
        stack: 'stack',
        // focus: 'none' 禁用 hover 时其他 series 变灰的 blur 效果
        emphasis: {
          focus: 'none'
        },
        blur: {
          itemStyle: { opacity: 1 }
        }
      }

      if (showLabel) {
        seriesOption.label = {
          show: true,
          position: 'inside',
          formatter: (params: CallbackDataParams) => {
            const numericValue =
              typeof params.value === 'number'
                ? params.value
                : Array.isArray(params.value)
                  ? typeof params.value[0] === 'number'
                    ? params.value[0]
                    : Number(params.value[0]) || 0
                  : Number(params.value) || 0
            return formatValue(numericValue, showPercentage)
          }
        }
      }

      seriesOption.itemStyle = {
        color: colors[index % colors.length]
      }

      return seriesOption
    }
  })

  // 构建 tooltip
  const tooltipFormatter = (
    params: TooltipCallbackDataParams | TooltipCallbackDataParams[] | CallbackDataParams | CallbackDataParams[]
  ) => {
    const paramsArray = Array.isArray(params) ? params : [params]
    if (paramsArray.length === 0) return ''

    const firstParam = paramsArray[0] as TooltipCallbackDataParams
    const axisValue = firstParam.axisValue ?? firstParam.name ?? ''
    let result = `<div style="padding: 8px;"><div style="margin-bottom: 4px; font-weight: bold;">${axisValue}</div>`

    // 计算合计值
    let total = 0
    for (const param of paramsArray) {
      const numericValue =
        typeof param.value === 'number'
          ? param.value
          : Array.isArray(param.value)
            ? typeof param.value[0] === 'number'
              ? param.value[0]
              : Number(param.value[0]) || 0
            : Number(param.value) || 0
      total += numericValue
    }

    for (const param of paramsArray) {
      const numericValue =
        typeof param.value === 'number'
          ? param.value
          : Array.isArray(param.value)
            ? typeof param.value[0] === 'number'
              ? param.value[0]
              : Number(param.value[0]) || 0
            : Number(param.value) || 0
      const value = formatValue(numericValue, showPercentage)
      const pct = !showPercentage && total > 0 ? ` (${((numericValue / total) * 100).toFixed(1)}%)` : ''
      result += `<div style="display: flex; align-items: center; padding: 4px 0;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${param.color}; margin-right: 8px;"></span>
            <span style="margin-right: 12px;">${param.seriesName}</span>
            <span style="font-weight: bold;">${value}${pct}</span>
          </div>`
    }

    // 显示合计
    if (paramsArray.length > 1) {
      result += `<div style="border-top: 1px solid #eee; margin-top: 4px; padding-top: 4px; font-weight: bold;">
            合计: ${formatValue(total, showPercentage)}
          </div>`
    }

    result += '</div>'
    return result
  }

  // 构建 ECharts 配置
  const option: EChartsCoreOption = {
    title: {
      text: config.title || (isAreaMode ? '堆叠面积图' : '堆叠柱状图'),
      left: 'center',
      top: 10,
      bottom: 10
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: isAreaMode ? 'line' : 'shadow'
      },
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
      boundaryGap: !isAreaMode,
      data: xAxisData,
      name: xAxisTitle,
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: showPercentage ? '百分比 (%)' : yAxisTitle,
      nameLocation: 'middle',
      nameGap: 40,
      max: showPercentage ? 100 : undefined,
      axisLabel: {
        formatter: (value: number) => formatValue(value, showPercentage)
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
