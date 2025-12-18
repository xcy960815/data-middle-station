import type { EChartsCoreOption } from 'echarts/core'

/**
 * 图表渲染配置接口
 * @interface ChartRenderConfig
 * @property {string} title 图表标题
 * @property {Array<AnalyzeDataVo.AnalyzeData>} data 图表数据
 * @property {Array<AnalyzeConfigDao.GroupOptions>} xAxisFields X轴字段
 * @property {Array<AnalyzeConfigDao.DimensionOptions>} yAxisFields Y轴字段
 */
export interface ChartRenderConfig {
  title: string
  data: Array<AnalyzeDataVo.AnalyzeData>
  xAxisFields: Array<AnalyzeConfigDao.GroupOptions>
  yAxisFields: Array<AnalyzeConfigDao.DimensionOptions>
}

/**
 * 通用图表渲染器接口
 * @interface ChartRenderer
 * @method renderIntervalChart 渲染柱状图
 * @method renderLineChart 渲染折线图
 * @method renderPieChart 渲染饼图
 */
export interface ChartRenderer {
  renderIntervalChart(
    config: ChartRenderConfig,
    chartConfig?: AnalyzeConfigDao.IntervalChartConfig
  ): EChartsCoreOption | null
  renderLineChart(config: ChartRenderConfig, chartConfig?: AnalyzeConfigDao.LineChartConfig): EChartsCoreOption | null
  renderPieChart(config: ChartRenderConfig, chartConfig?: AnalyzeConfigDao.PieChartConfig): EChartsCoreOption | null
}

/**
 * 公共数据处理逻辑
 */
export interface ChartDataProcessResult {
  /**
   * X轴字段名称
   */
  xFieldName: string
  /**
   * 度量字段名称
   */
  measureFields: string[]
  /**
   * 分组字段名称
   */
  groupFieldName?: string
  /**
   * 是否使用折叠
   */
  useFold: boolean
  /**
   * X轴标题
   */
  xAxisTitle: string
  /**
   * Y轴标题
   */
  yAxisTitle: string
}

/**
 * 处理图表数据配置
 * @param {ChartRenderConfig} config 图表配置
 * @returns {ChartDataProcessResult} 处理后的图表数据配置
 */
export function processChartData(config: ChartRenderConfig): ChartDataProcessResult {
  // 维度与度量：yAxisFields 最后一个为 X 轴，其余为度量
  const xFieldName = config.yAxisFields[config.yAxisFields.length - 1].columnName
  // 度量字段名称
  const measureFields = config.yAxisFields
    .slice(0, config.yAxisFields.length - 1)
    .map((item) => item.columnName) as string[]

  // 可选分组（用于单度量或双层分组）
  const groupFieldName = config.xAxisFields[0]?.columnName

  const useFold = measureFields.length > 1

  // 轴标题（优先显示中文别名）
  const xFieldOption = config.yAxisFields[config.yAxisFields.length - 1]
  const xAxisTitle = xFieldOption?.displayName || xFieldOption?.columnComment || xFieldOption?.columnName || ''

  let yAxisTitle = ''
  // 如果不需要折叠，则取度量字段名称
  if (!useFold) {
    const yFieldOption = config.yAxisFields.find((item) => item.columnName === measureFields[0])
    yAxisTitle = yFieldOption?.displayName || yFieldOption?.columnComment || yFieldOption?.columnName || ''
  }

  return {
    xFieldName,
    measureFields,
    groupFieldName,
    useFold,
    xAxisTitle,
    yAxisTitle
  }
}

/**
 * 获取默认图表颜色
 * @returns {string[]} 默认图表颜色
 */
export function getDefaultChartColors(): string[] {
  return ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E86452', '#6DC8EC', '#945FB9', '#FF9845', '#1E9493', '#FF99C3']
}

/**
 * 格式化数值显示
 * @param {number} value 数值
 * @param {boolean} showPercentage 是否显示百分比
 * @returns {string} 格式化后的数值
 */
export function formatValue(value: number, showPercentage: boolean): string {
  if (showPercentage) {
    return `${value.toFixed(1)}%`
  }
  // 数字格式化：添加千分位分隔符
  if (Number.isInteger(value)) {
    return value.toLocaleString('zh-CN')
  }
  // 小数保留2位，并添加千分位分隔符
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/**
 * 处理数据折叠（fold transform）
 * @param {Array<AnalyzeDataVo.AnalyzeData>} data 原始数据
 * @param {string[]} measureFields 度量字段
 * @param {string} xFieldName X轴字段
 * @param {string} groupFieldName 分组字段
 * @returns {Array<AnalyzeDataVo.AnalyzeData & { key: string; value: number }>} 折叠后的数据
 */
export function foldData(
  data: Array<AnalyzeDataVo.AnalyzeData>,
  measureFields: string[]
): Array<AnalyzeDataVo.AnalyzeData & { key: string; value: number }> {
  const foldedData: Array<AnalyzeDataVo.AnalyzeData & { key: string; value: number }> = []
  for (const item of data) {
    for (const field of measureFields) {
      const value = Number(item[field] || 0)
      const newItem = {
        ...item,
        key: field,
        value
      }
      foldedData.push(newItem)
    }
  }
  return foldedData
}

/**
 * 月份映射表（用于排序）
 * 支持月份缩写和完整月份名称
 */
const MONTH_MAP: Record<string, number> = {
  // 月份缩写
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
  // 完整月份名称
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12
}

/**
 * 星期映射表（用于排序）
 * 支持星期缩写和完整星期名称
 * 注意：星期从周一开始（Monday = 1, Sunday = 7）
 */
const WEEKDAY_MAP: Record<string, number> = {
  // 星期缩写
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
  // 完整星期名称
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
}

/**
 * 规范化月份名称（支持大小写不敏感）
 * @param {string} value 月份字符串
 * @returns {string | null} 规范化后的月份键，如果不存在则返回 null
 */
function normalizeMonthName(value: string): string | null {
  const monthKeys = Object.keys(MONTH_MAP)
  // 先尝试精确匹配
  if (monthKeys.includes(value)) {
    return value
  }
  // 尝试大小写不敏感匹配
  const lowerValue = value.toLowerCase()
  for (const key of monthKeys) {
    if (key.toLowerCase() === lowerValue) {
      return key
    }
  }
  return null
}

/**
 * 检测数据是否都是月份（缩写或完整名称，支持大小写不敏感）
 * @param {Set<string>} dataSet 数据集合
 * @returns {boolean} 是否都是月份
 */
function isMonthNames(dataSet: Set<string>): boolean {
  if (dataSet.size === 0) {
    return false
  }
  for (const value of dataSet) {
    if (normalizeMonthName(value) === null) {
      return false
    }
  }
  return true
}

/**
 * 规范化星期名称（支持大小写不敏感）
 * @param {string} value 星期字符串
 * @returns {string | null} 规范化后的星期键，如果不存在则返回 null
 */
function normalizeWeekdayName(value: string): string | null {
  const weekdayKeys = Object.keys(WEEKDAY_MAP)
  // 先尝试精确匹配
  if (weekdayKeys.includes(value)) {
    return value
  }
  // 尝试大小写不敏感匹配
  const lowerValue = value.toLowerCase()
  for (const key of weekdayKeys) {
    if (key.toLowerCase() === lowerValue) {
      return key
    }
  }
  return null
}

/**
 * 检测数据是否都是星期（缩写或完整名称，支持大小写不敏感）
 * @param {Set<string>} dataSet 数据集合
 * @returns {boolean} 是否都是星期
 */
function isWeekdayNames(dataSet: Set<string>): boolean {
  if (dataSet.size === 0) {
    return false
  }
  for (const value of dataSet) {
    if (normalizeWeekdayName(value) === null) {
      return false
    }
  }
  return true
}

/**
 * 解析日期字符串为时间戳
 * 支持多种日期格式：
 * - YYYYMMDD: "20251124"
 * - YYYY-MM-DD: "2025-11-24"
 * - YYYY/MM/DD: "2025/11/24"
 * - YYYYMMDDHHmmss: "20251124120000"
 * - YYYY-MM-DD HH:mm:ss: "2025-11-24 12:00:00"
 * - YYYY-MM-DDTHH:mm:ss: "2025-11-24T12:00:00"
 * @param {string} dateStr 日期字符串
 * @returns {number | null} 时间戳，如果无法解析则返回 null
 */
function parseDateString(dateStr: string): number | null {
  // 处理纯数字格式（优先处理，因为标准 Date 可能无法正确解析）

  // 处理 YYYYMMDD 格式（8位数字）
  const pureYyyymmddMatch = dateStr.match(/^(\d{8})$/)
  if (pureYyyymmddMatch) {
    const year = parseInt(dateStr.substring(0, 4), 10)
    const month = parseInt(dateStr.substring(4, 6), 10) - 1 // 月份从0开始
    const day = parseInt(dateStr.substring(6, 8), 10)
    const parsedDate = new Date(year, month, day)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.getTime()
    }
  }

  // 处理 YYYYMMDDHHmm 格式（12位数字）
  const yyyymmddhhmmMatch = dateStr.match(/^(\d{12})$/)
  if (yyyymmddhhmmMatch) {
    const year = parseInt(dateStr.substring(0, 4), 10)
    const month = parseInt(dateStr.substring(4, 6), 10) - 1
    const day = parseInt(dateStr.substring(6, 8), 10)
    const hour = parseInt(dateStr.substring(8, 10), 10)
    const minute = parseInt(dateStr.substring(10, 12), 10)
    const parsedDate = new Date(year, month, day, hour, minute)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.getTime()
    }
  }

  // 处理 YYYYMMDDHHmmss 格式（14位数字）
  const yyyymmddhhmmssMatch = dateStr.match(/^(\d{14})$/)
  if (yyyymmddhhmmssMatch) {
    const year = parseInt(dateStr.substring(0, 4), 10)
    const month = parseInt(dateStr.substring(4, 6), 10) - 1
    const day = parseInt(dateStr.substring(6, 8), 10)
    const hour = parseInt(dateStr.substring(8, 10), 10)
    const minute = parseInt(dateStr.substring(10, 12), 10)
    const second = parseInt(dateStr.substring(12, 14), 10)
    const parsedDate = new Date(year, month, day, hour, minute, second)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.getTime()
    }
  }

  // 尝试标准 Date 解析（处理带分隔符的格式，如 "2025-11-24"）
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    return date.getTime()
  }

  return null
}

/**
 * 检测数据是否都是日期格式字符串
 * @param {Set<string>} dataSet 数据集合
 * @returns {boolean} 是否都是日期格式
 */
function isDateStrings(dataSet: Set<string>): boolean {
  // 如果数据集合为空，返回 false
  if (dataSet.size === 0) {
    return false
  }

  // 检查所有值是否都能解析为有效日期
  let validDateCount = 0
  for (const value of dataSet) {
    const timestamp = parseDateString(value)
    if (timestamp !== null) {
      validDateCount++
    }
  }

  // 如果超过80%的值都能解析为日期，认为是日期格式
  // 这样可以容忍一些异常值
  return validDateCount / dataSet.size >= 0.8
}

/**
 * 根据字段类型对 X 轴数据进行排序
 * @param {Set<string>} xAxisDataSet X轴数据集合
 * @param {string} columnType 字段类型
 * @returns {string[]} 排序后的X轴数据
 */
export function sortXAxisData(xAxisDataSet: Set<string>, columnType: string): string[] {
  // 检测是否是月份（缩写或完整名称）
  if (isMonthNames(xAxisDataSet)) {
    return Array.from(xAxisDataSet).sort((a, b) => {
      const normalizedA = normalizeMonthName(a)
      const normalizedB = normalizeMonthName(b)
      const monthA = normalizedA ? MONTH_MAP[normalizedA] : 0
      const monthB = normalizedB ? MONTH_MAP[normalizedB] : 0
      return monthA - monthB
    })
  }

  // 检测是否是星期（缩写或完整名称）
  if (isWeekdayNames(xAxisDataSet)) {
    return Array.from(xAxisDataSet).sort((a, b) => {
      const normalizedA = normalizeWeekdayName(a)
      const normalizedB = normalizeWeekdayName(b)
      const weekdayA = normalizedA ? WEEKDAY_MAP[normalizedA] : 0
      const weekdayB = normalizedB ? WEEKDAY_MAP[normalizedB] : 0
      return weekdayA - weekdayB
    })
  }

  // 检测是否是日期格式字符串（无论 columnType 是什么）
  if (isDateStrings(xAxisDataSet)) {
    return Array.from(xAxisDataSet).sort((a, b) => {
      const dateA = parseDateString(a)
      const dateB = parseDateString(b)
      if (dateA !== null && dateB !== null) {
        return dateA - dateB
      }
      // 如果无法解析，使用字符串排序作为后备
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    })
  }

  return Array.from(xAxisDataSet).sort((a, b) => {
    // 数字类型排序
    if (
      columnType.includes('int') ||
      columnType.includes('decimal') ||
      columnType.includes('float') ||
      columnType.includes('double') ||
      columnType.includes('numeric') ||
      columnType.includes('number')
    ) {
      const numA = Number(a)
      const numB = Number(b)
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      // 如果无法转换为数字，使用字符串排序作为后备
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    } else if (columnType.includes('date') || columnType.includes('time') || columnType.includes('timestamp')) {
      // 日期类型排序
      const dateA = new Date(a).getTime()
      const dateB = new Date(b).getTime()
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB
      }
      // 如果无法转换为日期，使用字符串排序作为后备
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    } else {
      // 默认字符串排序
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    }
  })
}
