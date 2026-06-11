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

// 扩展 CallbackDataParams 以包含 axisValue 属性（在 axis trigger 模式下可用）
interface TooltipCallbackDataParams extends CallbackDataParams {
  axisValue?: string | number
  axisValueLabel?: string
}

/**
 * 渲染双轴组合图（柱状 + 折线，左右双 Y 轴）
 * - 当有 2 个度量时：第一个度量 → 柱状（左轴），第二个度量 → 折线（右轴）
 * - 当有 1 个度量时：退化为柱状图 + 折线图叠加（共用左轴），右轴隐藏
 * - 当有第二维度时：按第二维度拆分为多系列
 * @param {ChartRenderConfig} config 图表配置
 * @param {AnalyzeConfigDao.ComboChartConfig} chartConfig 组合图特有配置
 * @returns {EChartsCoreOption | null} ECharts 配置选项
 */
export function renderComboChart(
  config: ChartRenderConfig,
  chartConfig: AnalyzeConfigDao.ComboChartConfig
): EChartsCoreOption | null {
  const { showPoint = true, showLabel = false, smooth = false, horizontalBar = false } = chartConfig

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

  // 判断是否为双度量模式
  const hasDualMeasure = measureFields.length >= 2

  // 构建系列数据
  // 对于双度量模式：分别为每个度量构建系列
  // 对于单度量模式：如果有 seriesDimension，按维度拆分系列
  const colors = getDefaultChartColors()

  // ====== 双度量模式 ======
  if (hasDualMeasure) {
    const barMeasure = measureFields[0]
    const lineMeasure = measureFields[1]

    // 获取度量字段的显示名称
    const barFieldOption = config.yAxisFields.find((f) => f.columnName === barMeasure)
    const lineFieldOption = config.yAxisFields.find((f) => f.columnName === lineMeasure)
    const barDisplayName = barFieldOption?.displayName || barFieldOption?.columnComment || barMeasure
    const lineDisplayName = lineFieldOption?.displayName || lineFieldOption?.columnComment || lineMeasure

    // 如果有系列维度，按维度拆分
    const barSeriesMap = new Map<string, number[]>()
    const lineSeriesMap = new Map<string, number[]>()
    const legendData: string[] = []

    if (seriesDimensionFieldName) {
      // 按维度拆分
      for (const item of processedData) {
        const seriesDim = String(item[seriesDimensionFieldName] || '')
        const xValue = String(item[xFieldName] || '')
        const barValue = Number(item[barMeasure] || 0)
        const lineValue = Number(item[lineMeasure] || 0)

        const barSeriesName = `${seriesDim}-${barDisplayName}`
        const lineSeriesName = `${seriesDim}-${lineDisplayName}`

        if (!barSeriesMap.has(barSeriesName)) {
          barSeriesMap.set(barSeriesName, new Array(xAxisData.length).fill(0))
          legendData.push(barSeriesName)
        }
        if (!lineSeriesMap.has(lineSeriesName)) {
          lineSeriesMap.set(lineSeriesName, new Array(xAxisData.length).fill(0))
          legendData.push(lineSeriesName)
        }

        const idx = xAxisData.indexOf(xValue)
        if (idx >= 0) {
          barSeriesMap.get(barSeriesName)![idx] = barValue
          lineSeriesMap.get(lineSeriesName)![idx] = lineValue
        }
      }
    } else {
      // 不拆分维度
      const barData = new Array(xAxisData.length).fill(0)
      const lineData = new Array(xAxisData.length).fill(0)
      legendData.push(barDisplayName, lineDisplayName)

      for (const item of processedData) {
        const xValue = String(item[xFieldName] || '')
        const idx = xAxisData.indexOf(xValue)
        if (idx >= 0) {
          barData[idx] = Number(item[barMeasure] || 0)
          lineData[idx] = Number(item[lineMeasure] || 0)
        }
      }

      barSeriesMap.set(barDisplayName, barData)
      lineSeriesMap.set(lineDisplayName, lineData)
    }

    // 构建柱状系列
    const barSeries: BarSeriesOption[] = Array.from(barSeriesMap.entries()).map(([name, data], index) => {
      const seriesOption: BarSeriesOption = {
        name,
        type: 'bar',
        yAxisIndex: 0,
        data,
        itemStyle: {
          color: colors[index % colors.length]
        }
      }

      if (showLabel) {
        seriesOption.label = {
          show: true,
          position: 'top',
          formatter: (params: CallbackDataParams) => {
            const val = typeof params.value === 'number' ? params.value : Number(params.value) || 0
            return formatValue(val, false)
          }
        }
      }

      return seriesOption
    })

    // 构建折线系列
    const lineSeries: LineSeriesOption[] = Array.from(lineSeriesMap.entries()).map(([name, data], index) => {
      const seriesOption: LineSeriesOption = {
        name,
        type: 'line',
        yAxisIndex: 1,
        data,
        smooth,
        symbol: showPoint ? 'circle' : 'none',
        symbolSize: showPoint ? 6 : 0,
        lineStyle: { width: 2 },
        itemStyle: {
          color: colors[(index + barSeries.length) % colors.length]
        }
      }

      if (showLabel) {
        seriesOption.label = {
          show: true,
          position: 'top',
          formatter: (params: CallbackDataParams) => {
            const val = typeof params.value === 'number' ? params.value : Number(params.value) || 0
            return formatValue(val, false)
          }
        }
      }

      return seriesOption
    })

    const series = [...barSeries, ...lineSeries]

    // 获取右轴标题
    const rightAxisTitle = lineDisplayName

    // 构建 tooltip
    const tooltipFormatter = (
      params: TooltipCallbackDataParams | TooltipCallbackDataParams[] | CallbackDataParams | CallbackDataParams[]
    ) => {
      const paramsArray = Array.isArray(params) ? params : [params]
      if (paramsArray.length === 0) return ''

      const firstParam = paramsArray[0] as TooltipCallbackDataParams
      const axisValue = firstParam.axisValue ?? firstParam.name ?? ''
      let result = `<div style="padding: 8px;"><div style="margin-bottom: 4px; font-weight: bold;">${axisValue}</div>`

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
        result += `<div style="display: flex; align-items: center; padding: 4px 0;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${param.color}; margin-right: 8px;"></span>
              <span style="margin-right: 12px;">${param.seriesName}</span>
              <span style="font-weight: bold;">${value}</span>
            </div>`
      }
      result += '</div>'
      return result
    }

    const option: EChartsCoreOption = {
      title: {
        text: config.title || '组合图',
        left: 'center',
        top: 10,
        bottom: 10
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
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
        data: xAxisData,
        name: xAxisTitle,
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: [
        {
          type: 'value',
          name: yAxisTitle,
          nameLocation: 'middle',
          nameGap: 40,
          position: 'left',
          axisLabel: {
            formatter: (value: number) => formatValue(value, false)
          }
        },
        {
          type: 'value',
          name: rightAxisTitle,
          nameLocation: 'middle',
          nameGap: 40,
          position: 'right',
          axisLabel: {
            formatter: (value: number) => formatValue(value, false)
          }
        }
      ],
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

  // ====== 单度量模式（退化为柱线叠加） ======
  const singleMeasure = measureFields[0]
  const singleFieldOption = config.yAxisFields.find((f) => f.columnName === singleMeasure)
  const singleDisplayName = singleFieldOption?.displayName || singleFieldOption?.columnComment || singleMeasure

  // 构建系列数据
  const seriesMap = new Map<string, number[]>()
  const legendData: string[] = []

  const getSeriesName = (item: AnalyzeDataVo.AnalyzeData): string => {
    if (seriesDimensionFieldName) {
      return String(item[seriesDimensionFieldName] || '')
    }
    return singleDisplayName
  }

  for (const item of processedData) {
    const seriesName = getSeriesName(item)
    const xValue = String(item[xFieldName] || '')
    const value = Number(item[singleMeasure] || 0)

    if (!seriesMap.has(seriesName)) {
      seriesMap.set(seriesName, new Array(xAxisData.length).fill(0))
      legendData.push(seriesName)
    }

    const index = xAxisData.indexOf(xValue)
    if (index >= 0) {
      seriesMap.get(seriesName)![index] = value
    }
  }

  // 每个系列同时生成柱状和折线
  const series: (BarSeriesOption | LineSeriesOption)[] = []
  let colorIndex = 0

  for (const [name, data] of seriesMap.entries()) {
    const color = colors[colorIndex % colors.length]
    colorIndex++

    // 柱状系列
    const barSeries: BarSeriesOption = {
      name: `${name}(柱)`,
      type: 'bar',
      yAxisIndex: 0,
      data,
      itemStyle: { color }
    }

    // 折线系列
    const lineSeries: LineSeriesOption = {
      name: `${name}(线)`,
      type: 'line',
      yAxisIndex: 0,
      data,
      smooth,
      symbol: showPoint ? 'circle' : 'none',
      symbolSize: showPoint ? 6 : 0,
      lineStyle: { width: 2 },
      itemStyle: { color }
    }

    if (showLabel) {
      barSeries.label = {
        show: true,
        position: 'top',
        formatter: (params: CallbackDataParams) => {
          const val = typeof params.value === 'number' ? params.value : Number(params.value) || 0
          return formatValue(val, false)
        }
      }
    }

    series.push(barSeries, lineSeries)
    legendData.push(`${name}(柱)`, `${name}(线)`)
  }

  // 移除原始 legendData 中的旧名称（已在上面添加了带后缀的）
  const filteredLegend = legendData.filter((name) => name.endsWith('(柱)') || name.endsWith('(线)'))

  const tooltipFormatter = (
    params: TooltipCallbackDataParams | TooltipCallbackDataParams[] | CallbackDataParams | CallbackDataParams[]
  ) => {
    const paramsArray = Array.isArray(params) ? params : [params]
    if (paramsArray.length === 0) return ''

    const firstParam = paramsArray[0] as TooltipCallbackDataParams
    const axisValue = firstParam.axisValue ?? firstParam.name ?? ''
    let result = `<div style="padding: 8px;"><div style="margin-bottom: 4px; font-weight: bold;">${axisValue}</div>`

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
      result += `<div style="display: flex; align-items: center; padding: 4px 0;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${param.color}; margin-right: 8px;"></span>
            <span style="margin-right: 12px;">${param.seriesName}</span>
            <span style="font-weight: bold;">${value}</span>
          </div>`
    }
    result += '</div>'
    return result
  }

  const option: EChartsCoreOption = {
    title: {
      text: config.title || '组合图',
      left: 'center',
      top: 10,
      bottom: 10
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: tooltipFormatter
    },
    legend: {
      data: filteredLegend,
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
