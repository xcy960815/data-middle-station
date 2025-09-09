import dayjs from 'dayjs'

export enum FormatType {
  // 数字
  数字 = 1,
  // 百分比
  百分比 = 2,
  // 货币
  货币 = 3,
  // 时间
  时间 = 4,
  // 链接跳转
  链接跳转 = 5,
  // 自定义
  自定义 = 6,
  // 无格式
  无格式 = -1
}

export interface FormatConfig {
  formatType: FormatType
  currency: string
  customCurrencySymbol: string
  dateFormat: string
  template: string
  color: string
  target: string
  url: string
  fen2yuan: boolean
}

export interface ChartColorConfig {
  primary: string[]
  secondary?: string[]
  custom?: string[]
}

/**
 * 图表格式化和工具组合式函数
 */
export function useChartFormat() {
  /**
   * 获取默认图表颜色
   * @returns 默认颜色数组
   */
  const getDefaultChartColors = (): string[] => {
    return [
      '#509EE3',
      '#FF7F0E',
      '#2CA02C',
      '#D62728',
      '#9467BD',
      '#8C564B',
      '#E377C2',
      '#7F7F7F',
      '#BCBD22',
      '#17BECF'
    ]
  }

  /**
   * 获取图表颜色配置
   * @param config 颜色配置选项
   * @returns 处理后的颜色数组
   */
  const getChartColors = (config?: ChartColorConfig): string[] => {
    if (config?.custom && config.custom.length > 0) {
      return config.custom
    }

    if (config?.primary) {
      return config.primary
    }

    return getDefaultChartColors()
  }

  /**
   * 格式化数据
   * @param sourceData 源数据
   * @param formatConfig 格式化配置
   * @returns 格式化后的数据
   */
  const formatData = (sourceData: string | number, formatConfig: FormatConfig): string | number => {
    if (sourceData === null || sourceData === undefined) {
      return ''
    }

    switch (formatConfig.formatType) {
      case FormatType.数字:
        return formatNumberData(sourceData)

      case FormatType.百分比:
        return formatPercentageData(sourceData)

      case FormatType.货币:
        return formatCurrencyData(sourceData, formatConfig)

      case FormatType.时间:
        return formatTimeData(sourceData, formatConfig)

      case FormatType.链接跳转:
        return formatLinkData(sourceData, formatConfig)

      case FormatType.自定义:
        return formatCustomData(sourceData, formatConfig)

      case FormatType.无格式:
      default:
        return sourceData
    }
  }

  /**
   * 格式化数字数据
   * @param sourceData 源数据
   * @returns 格式化后的数字
   */
  const formatNumberData = (sourceData: string | number): string | number => {
    if (typeof sourceData === 'number' && !isNaN(sourceData)) {
      return sourceData
    }

    const num = Number(sourceData)
    return isNaN(num) ? '' : num
  }

  /**
   * 格式化百分比数据
   * @param sourceData 源数据
   * @returns 格式化后的百分比字符串
   */
  const formatPercentageData = (sourceData: string | number): string => {
    const num = Number(sourceData)
    if (isNaN(num)) {
      return ''
    }
    return `${num}%`
  }

  /**
   * 格式化货币数据
   * @param sourceData 源数据
   * @param formatConfig 格式化配置
   * @returns 格式化后的货币字符串
   */
  const formatCurrencyData = (sourceData: string | number, formatConfig: FormatConfig): string => {
    const num = Number(sourceData)
    if (isNaN(num)) {
      return ''
    }

    const currency = formatConfig.customCurrencySymbol || formatConfig.currency || '¥'
    const amount = formatConfig.fen2yuan ? num / 100 : num

    return `${currency}${amount.toFixed(2)}`
  }

  /**
   * 格式化时间数据
   * @param sourceData 源数据
   * @param formatConfig 格式化配置
   * @returns 格式化后的时间字符串
   */
  const formatTimeData = (sourceData: string | number, formatConfig: FormatConfig): string => {
    // 如果是数字，检查是否是有效的时间戳
    if (typeof sourceData === 'number') {
      if (isNaN(sourceData)) {
        return '无效的日期'
      }
      return dayjs(sourceData).format(formatConfig.dateFormat || 'YYYY-MM-DD')
    }

    // 如果是字符串，尝试解析为日期
    if (typeof sourceData === 'string') {
      if (isNaN(Date.parse(sourceData))) {
        return '无效的日期'
      }
      return dayjs(sourceData).format(formatConfig.dateFormat || 'YYYY-MM-DD')
    }

    return '无效的日期'
  }

  /**
   * 格式化链接数据
   * @param sourceData 源数据
   * @param formatConfig 格式化配置
   * @returns 格式化后的链接HTML字符串
   */
  const formatLinkData = (sourceData: string | number, formatConfig: FormatConfig): string => {
    const color = formatConfig.color || '#1890ff'
    const target = formatConfig.target === '_blank' ? 'target="_blank"' : 'target="_self"'
    const url = formatConfig.url?.replace(/\$\{value\}/g, String(sourceData)) || '#'
    const href = url ? `href="${url}"` : ''

    return `<a ${href} style="color:${color}" ${target}>${sourceData}</a>`
  }

  /**
   * 格式化自定义模板数据
   * @param sourceData 源数据
   * @param formatConfig 格式化配置
   * @returns 格式化后的字符串
   */
  const formatCustomData = (sourceData: string | number, formatConfig: FormatConfig): string => {
    try {
      // 使用模板字符串进行格式化，但避免使用 eval
      const template = formatConfig.template || '${value}'
      return template.replace(/\$\{value\}/g, String(sourceData))
    } catch (error) {
      console.warn('自定义模板格式化失败:', error)
      return String(sourceData)
    }
  }

  /**
   * 批量格式化数据
   * @param dataArray 数据数组
   * @param formatConfig 格式化配置
   * @returns 格式化后的数据数组
   */
  const formatDataBatch = (dataArray: Array<string | number>, formatConfig: FormatConfig): Array<string | number> => {
    return dataArray.map((data) => formatData(data, formatConfig))
  }

  /**
   * 验证格式化配置
   * @param formatConfig 格式化配置
   * @returns 验证结果
   */
  const validateFormatConfig = (
    formatConfig: Partial<FormatConfig>
  ): {
    valid: boolean
    errors: string[]
  } => {
    const errors: string[] = []

    if (!formatConfig.formatType) {
      errors.push('格式类型不能为空')
    }

    if (formatConfig.formatType === FormatType.货币 && !formatConfig.currency && !formatConfig.customCurrencySymbol) {
      errors.push('货币格式需要指定货币符号')
    }

    if (formatConfig.formatType === FormatType.时间 && !formatConfig.dateFormat) {
      errors.push('时间格式需要指定日期格式')
    }

    if (formatConfig.formatType === FormatType.链接跳转 && !formatConfig.url) {
      errors.push('链接格式需要指定URL模板')
    }

    if (formatConfig.formatType === FormatType.自定义 && !formatConfig.template) {
      errors.push('自定义格式需要指定模板')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  return {
    // 颜色相关
    getDefaultChartColors,
    getChartColors,

    // 格式化相关
    formatData,
    formatNumberData,
    formatPercentageData,
    formatCurrencyData,
    formatTimeData,
    formatLinkData,
    formatCustomData,
    formatDataBatch,

    // 工具函数
    validateFormatConfig,

    // 枚举和类型
    FormatType
  }
}
