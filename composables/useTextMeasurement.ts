export interface TextMeasurementOptions {
  fontSize?: string
  fontFamily?: string
  fontWeight?: string | number
  letterSpacing?: string
  className?: string
}

export interface TextMeasurementResult {
  width: number
  height: number
}

/**
 * 文本测量组合式函数
 */
export function useTextMeasurement() {
  /**
   * 获取文本宽度
   * @param innerText 文本内容
   * @param options 测量选项
   * @returns 文本宽度（像素）
   */
  const getTextWidth = (innerText: string, options: TextMeasurementOptions = {}): number => {
    if (!process.client) {
      return 0
    }

    const span = document.createElement('span') as HTMLSpanElement
    span.innerText = innerText

    // 使用个性化的类名避免冲突
    const uniqueClassName = `get-text-width-${innerText.length}-${Math.random()}`
    span.className = options.className || uniqueClassName

    // 应用样式选项
    if (options.fontSize) span.style.fontSize = options.fontSize
    if (options.fontFamily) span.style.fontFamily = options.fontFamily
    if (options.fontWeight) span.style.fontWeight = String(options.fontWeight)
    if (options.letterSpacing) span.style.letterSpacing = options.letterSpacing

    // 设置默认样式以确保准确测量
    span.style.position = 'absolute'
    span.style.visibility = 'hidden'
    span.style.whiteSpace = 'nowrap'

    // 向body添加节点，获取宽度，然后移除
    document.body.appendChild(span)
    const width = span.offsetWidth
    span.remove()

    return width
  }

  /**
   * 获取文本尺寸（宽度和高度）
   * @param innerText 文本内容
   * @param options 测量选项
   * @returns 文本尺寸对象
   */
  const getTextSize = (innerText: string, options: TextMeasurementOptions = {}): TextMeasurementResult => {
    if (!process.client) {
      return { width: 0, height: 0 }
    }

    const span = document.createElement('span') as HTMLSpanElement
    span.innerText = innerText

    const uniqueClassName = `get-text-size-${innerText.length}-${Math.random()}`
    span.className = options.className || uniqueClassName

    // 应用样式选项
    if (options.fontSize) span.style.fontSize = options.fontSize
    if (options.fontFamily) span.style.fontFamily = options.fontFamily
    if (options.fontWeight) span.style.fontWeight = String(options.fontWeight)
    if (options.letterSpacing) span.style.letterSpacing = options.letterSpacing

    // 设置默认样式
    span.style.position = 'absolute'
    span.style.visibility = 'hidden'
    span.style.whiteSpace = 'nowrap'

    document.body.appendChild(span)
    const width = span.offsetWidth
    const height = span.offsetHeight
    span.remove()

    return { width, height }
  }

  /**
   * 遍历字符串数组，获取最宽一列的宽度
   * @param strings 字符串数组
   * @param options 测量选项
   * @returns 最大宽度（像素）
   */
  const getMaxTextWidth = (strings: Array<string>, options: TextMeasurementOptions = {}): number => {
    return strings.reduce((maxWidth, item) => {
      if (item) {
        const currentWidth = getTextWidth(item, options)
        return Math.max(maxWidth, currentWidth)
      }
      return maxWidth
    }, 0)
  }

  /**
   * 批量测量文本宽度
   * @param strings 字符串数组
   * @param options 测量选项
   * @returns 宽度数组
   */
  const measureTextWidths = (strings: Array<string>, options: TextMeasurementOptions = {}): number[] => {
    return strings.map((text) => getTextWidth(text, options))
  }

  /**
   * 批量测量文本尺寸
   * @param strings 字符串数组
   * @param options 测量选项
   * @returns 尺寸对象数组
   */
  const measureTextSizes = (strings: Array<string>, options: TextMeasurementOptions = {}): TextMeasurementResult[] => {
    return strings.map((text) => getTextSize(text, options))
  }

  /**
   * 计算文本在指定宽度内的行数
   * @param text 文本内容
   * @param maxWidth 最大宽度
   * @param options 测量选项
   * @returns 行数
   */
  const calculateTextLines = (text: string, maxWidth: number, options: TextMeasurementOptions = {}): number => {
    const words = text.split(' ')
    let lines = 1
    let currentLineWidth = 0

    for (const word of words) {
      const wordWidth = getTextWidth(word + ' ', options)

      if (currentLineWidth + wordWidth > maxWidth && currentLineWidth > 0) {
        lines++
        currentLineWidth = wordWidth
      } else {
        currentLineWidth += wordWidth
      }
    }

    return lines
  }

  /**
   * 截断文本以适应指定宽度
   * @param text 原始文本
   * @param maxWidth 最大宽度
   * @param ellipsis 省略号字符
   * @param options 测量选项
   * @returns 截断后的文本
   */
  const truncateText = (
    text: string,
    maxWidth: number,
    ellipsis: string = '...',
    options: TextMeasurementOptions = {}
  ): string => {
    const fullWidth = getTextWidth(text, options)

    if (fullWidth <= maxWidth) {
      return text
    }

    const ellipsisWidth = getTextWidth(ellipsis, options)
    const availableWidth = maxWidth - ellipsisWidth

    let truncated = ''
    let currentWidth = 0

    for (const char of text) {
      const charWidth = getTextWidth(char, options)

      if (currentWidth + charWidth > availableWidth) {
        break
      }

      truncated += char
      currentWidth += charWidth
    }

    return truncated + ellipsis
  }

  /**
   * 验证文本测量选项
   * @param options 测量选项
   * @returns 验证结果
   */
  const validateMeasurementOptions = (options: TextMeasurementOptions): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    // 验证字体大小
    if (options.fontSize && !/^\d+(\.\d+)?(px|em|rem|%|pt)$/.test(options.fontSize)) {
      errors.push('fontSize 格式无效，应该是数字加单位（如 "14px", "1.2em"）')
    }

    // 验证字体粗细
    if (
      options.fontWeight &&
      typeof options.fontWeight !== 'number' &&
      !['normal', 'bold', 'bolder', 'lighter'].includes(options.fontWeight as string) &&
      !/^[1-9]00$/.test(options.fontWeight as string)
    ) {
      errors.push('fontWeight 应该是数字（100-900）或预定义值（normal, bold, bolder, lighter）')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  return {
    getTextWidth,
    getTextSize,
    getMaxTextWidth,
    measureTextWidths,
    measureTextSizes,
    calculateTextLines,
    truncateText,
    validateMeasurementOptions
  }
}
