import type { ScatterSeriesOption } from 'echarts/charts'
import type { EChartsCoreOption } from 'echarts/core'
import type { CallbackDataParams } from 'echarts/types/dist/shared'
import { type ChartRenderConfig, formatValue, getDefaultChartColors } from './utils'

// 扩展 CallbackDataParams
interface TooltipCallbackDataParams extends CallbackDataParams {
  axisValue?: string | number
  axisValueLabel?: string
}

/**
 * 渲染散点图
 * - X 轴和 Y 轴各取一个度量字段
 * - 如果有第二维度，按维度分组着色
 * - symbolSize 可选绑定第三个度量（气泡图）
 * @param {ChartRenderConfig} config 图表配置
 * @param {AnalyzeConfigDao.ScatterChartConfig} chartConfig 散点图特有配置
 * @returns {EChartsCoreOption | null} ECharts 配置选项
 */
export function renderScatterChart(
  config: ChartRenderConfig,
  chartConfig: AnalyzeConfigDao.ScatterChartConfig
): EChartsCoreOption | null {
  const { showLabel = false, symbolSize = 10, showTrendLine = false } = chartConfig

  if (!config.data || config.data.length === 0) {
    return null
  }

  // 散点图需要至少 2 个度量字段（X 轴和 Y 轴）
  const measureFields = config.yAxisFields.map((item) => item.columnName).filter(Boolean) as string[]

  if (measureFields.length < 2) {
    // 如果只有 1 个度量，使用维度作为 X 轴
    const xFieldName = config.xAxisFields[0]?.columnName
    const yFieldName = measureFields[0]

    if (!xFieldName || !yFieldName) {
      return null
    }

    const xDisplayName = config.xAxisFields[0]?.displayName || config.xAxisFields[0]?.columnComment || xFieldName
    const yFieldOption = config.yAxisFields.find((f) => f.columnName === yFieldName)
    const yDisplayName = yFieldOption?.displayName || yFieldOption?.columnComment || yFieldName

    // 按维度分组
    const seriesDimensionFieldName = config.xAxisFields[1]?.columnName
    const seriesMap = new Map<string, Array<[string | number, number]>>()
    const legendData: string[] = []

    for (const item of config.data) {
      const xValue = item[xFieldName]
      const yValue = Number(item[yFieldName] || 0)
      const seriesName = seriesDimensionFieldName ? String(item[seriesDimensionFieldName] || '') : yDisplayName

      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, [])
        legendData.push(seriesName)
      }

      seriesMap.get(seriesName)!.push([xValue as string | number, yValue])
    }

    const colors = getDefaultChartColors()
    const series: ScatterSeriesOption[] = Array.from(seriesMap.entries()).map(([name, data], index) => {
      const seriesOption: ScatterSeriesOption = {
        name,
        type: 'scatter',
        data,
        symbolSize,
        itemStyle: {
          color: colors[index % colors.length],
          opacity: 0.8
        }
      }

      if (showLabel) {
        seriesOption.label = {
          show: true,
          position: 'top',
          formatter: (params: CallbackDataParams) => {
            const val = Array.isArray(params.value) ? params.value[1] : params.value
            return formatValue(Number(val) || 0, false)
          }
        }
      }

      return seriesOption
    })

    const tooltipFormatter = (params: CallbackDataParams | CallbackDataParams[]) => {
      const param = Array.isArray(params) ? params[0] : params
      if (!param) return ''

      const data = param.value as [string | number, number]
      const marker = (param as TooltipCallbackDataParams).marker || ''
      return `${param.seriesName}<br/>${marker}${xDisplayName}: ${data[0]}<br/>${marker}${yDisplayName}: ${formatValue(Number(data[1]) || 0, false)}`
    }

    const option: EChartsCoreOption = {
      title: {
        text: config.title || '散点图',
        left: 'center',
        top: 10,
        bottom: 10
      },
      tooltip: {
        trigger: 'item',
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
        name: xDisplayName,
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: {
        type: 'value',
        name: yDisplayName,
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: {
          formatter: (value: number) => formatValue(value, false)
        }
      },
      series
    }

    return option
  }

  // ====== 标准散点图模式：2+ 度量 ======
  const xMeasure = measureFields[0]
  const yMeasure = measureFields[1]
  // 第三个度量作为气泡大小（如果有）
  const sizeMeasure = measureFields.length >= 3 ? measureFields[2] : null

  const xFieldOption = config.yAxisFields.find((f) => f.columnName === xMeasure)
  const yFieldOption = config.yAxisFields.find((f) => f.columnName === yMeasure)
  const sizeFieldOption = sizeMeasure ? config.yAxisFields.find((f) => f.columnName === sizeMeasure) : null

  const xDisplayName = xFieldOption?.displayName || xFieldOption?.columnComment || xMeasure
  const yDisplayName = yFieldOption?.displayName || yFieldOption?.columnComment || yMeasure
  const sizeDisplayName = sizeFieldOption?.displayName || sizeFieldOption?.columnComment || sizeMeasure || ''

  // 按系列维度分组
  const seriesDimensionFieldName = config.xAxisFields[1]?.columnName || config.xAxisFields[0]?.columnName
  const seriesMap = new Map<string, Array<[number, number] | [number, number, number]>>()
  const legendData: string[] = []

  // 计算 sizeMeasure 的范围（用于映射气泡大小）
  let sizeMin = Infinity
  let sizeMax = -Infinity
  if (sizeMeasure) {
    for (const item of config.data) {
      const sizeVal = Number(item[sizeMeasure] || 0)
      sizeMin = Math.min(sizeMin, sizeVal)
      sizeMax = Math.max(sizeMax, sizeVal)
    }
    if (sizeMin === sizeMax) {
      sizeMax = sizeMin + 1
    }
  }

  for (const item of config.data) {
    const xValue = Number(item[xMeasure] || 0)
    const yValue = Number(item[yMeasure] || 0)
    const seriesName = seriesDimensionFieldName ? String(item[seriesDimensionFieldName] || '') : '数据'

    if (!seriesMap.has(seriesName)) {
      seriesMap.set(seriesName, [])
      legendData.push(seriesName)
    }

    if (sizeMeasure) {
      const sizeVal = Number(item[sizeMeasure] || 0)
      seriesMap.get(seriesName)!.push([xValue, yValue, sizeVal])
    } else {
      seriesMap.get(seriesName)!.push([xValue, yValue])
    }
  }

  // 映射气泡大小
  const mapSymbolSize = (sizeVal: number): number => {
    if (!sizeMeasure) return symbolSize
    const minSize = 5
    const maxSize = 40
    const ratio = (sizeVal - sizeMin) / (sizeMax - sizeMin)
    return minSize + ratio * (maxSize - minSize)
  }

  const colors = getDefaultChartColors()
  const series: ScatterSeriesOption[] = Array.from(seriesMap.entries()).map(([name, data], index) => {
    const seriesOption: ScatterSeriesOption = {
      name,
      type: 'scatter',
      data,
      symbolSize: sizeMeasure ? (val: number[]) => mapSymbolSize(val[2] || 0) : symbolSize,
      itemStyle: {
        color: colors[index % colors.length],
        opacity: 0.75
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      }
    }

    if (showLabel) {
      seriesOption.label = {
        show: true,
        position: 'top',
        formatter: (params: CallbackDataParams) => {
          const val = Array.isArray(params.value) ? params.value[1] : params.value
          return formatValue(Number(val) || 0, false)
        }
      }
    }

    return seriesOption
  })

  // 趋势线（简单线性回归）
  if (showTrendLine) {
    // 汇总所有数据点做回归
    const allPoints: Array<[number, number]> = []
    for (const data of seriesMap.values()) {
      for (const point of data) {
        allPoints.push([point[0], point[1]])
      }
    }

    if (allPoints.length >= 2) {
      // 简单最小二乘法
      const n = allPoints.length
      let sumX = 0
      let sumY = 0
      let sumXY = 0
      let sumXX = 0

      for (const [x, y] of allPoints) {
        sumX += x
        sumY += y
        sumXY += x * y
        sumXX += x * x
      }

      const denom = n * sumXX - sumX * sumX
      if (denom !== 0) {
        const slope = (n * sumXY - sumX * sumY) / denom
        const intercept = (sumY - slope * sumX) / n

        const xMin = Math.min(...allPoints.map((p) => p[0]))
        const xMax = Math.max(...allPoints.map((p) => p[0]))

        series.push({
          name: '趋势线',
          type: 'line',
          data: [
            [xMin, slope * xMin + intercept],
            [xMax, slope * xMax + intercept]
          ],
          symbol: 'none',
          lineStyle: {
            width: 2,
            type: 'dashed',
            color: '#999'
          },
          itemStyle: { color: '#999' }
        } as any)

        legendData.push('趋势线')
      }
    }
  }

  // 构建 tooltip
  const tooltipFormatter = (params: CallbackDataParams | CallbackDataParams[]) => {
    const param = Array.isArray(params) ? params[0] : params
    if (!param) return ''

    const data = param.value as number[]
    const marker = (param as TooltipCallbackDataParams).marker || ''
    let result = `${param.seriesName}<br/>`
    result += `${marker}${xDisplayName}: ${formatValue(Number(data[0]) || 0, false)}<br/>`
    result += `${marker}${yDisplayName}: ${formatValue(Number(data[1]) || 0, false)}`

    if (sizeMeasure && data.length >= 3) {
      result += `<br/>${marker}${sizeDisplayName}: ${formatValue(Number(data[2]) || 0, false)}`
    }

    return result
  }

  const option: EChartsCoreOption = {
    title: {
      text: config.title || (sizeMeasure ? '气泡图' : '散点图'),
      left: 'center',
      top: 10,
      bottom: 10
    },
    tooltip: {
      trigger: 'item',
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
      type: 'value',
      name: xDisplayName,
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        formatter: (value: number) => formatValue(value, false)
      }
    },
    yAxis: {
      type: 'value',
      name: yDisplayName,
      nameLocation: 'middle',
      nameGap: 40,
      axisLabel: {
        formatter: (value: number) => formatValue(value, false)
      }
    },
    series
  }

  return option
}
