import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import SummaryDropdown from './components/summary-dropdown.vue'
import { bindCurrentTableContext, getTableParams, getProcessedRows, getRuntimeState } from './parameter'
import { stageVars } from './stage-handler'
import {
  calculateTextWidth,
  createGroup,
  drawUnifiedRect,
  drawUnifiedText,
  setPointerStyle,
  truncateText
} from './utils'
import type { SummaryState } from './runtime-state'

export const summaryVars = new Proxy({} as SummaryState, {
  get: (_target, property: keyof SummaryState) => getRuntimeState().summary[property],
  set: (_target, property: keyof SummaryState, value) => {
    getRuntimeState().summary[property] = value as never
    return true
  }
})

/**
 * 汇总下拉组件引用
 */
export const summaryDropdownRef = new Proxy({} as { value: InstanceType<typeof SummaryDropdown> | null }, {
  get: (_target, property: 'value') => getRuntimeState().summaryDropdownRef[property],
  set: (_target, property: 'value', value) => {
    getRuntimeState().summaryDropdownRef[property] = value
    return true
  }
})

export const resetSummaryRuntimeState = () => {
  summaryVars.summaryLayer = null
  summaryVars.leftSummaryGroup = null
  summaryVars.centerSummaryGroup = null
  summaryVars.rightSummaryGroup = null
  summaryDropdownRef.value = null
  resetSummaryState()
}

/**
 * 数字列 汇总方式
 */
const numberOptions = [
  { label: '不展示', value: 'nodisplay' },
  { label: '最大', value: 'max' },
  { label: '最小', value: 'min' },
  { label: '平均', value: 'avg' },
  { label: '求和', value: 'sum' }
]

/**
 * 文本列 汇总方式
 */
const textOptions = [
  { label: '不展示', value: 'nodisplay' },
  { label: '已填写', value: 'filled' },
  { label: '未填写', value: 'nofilled' }
]

// 快捷方法 - 汇总分组
interface ClipOptions {
  width: number
  height: number
  x: number
  y: number
}

/**
 * 创建summary左侧组
 * @param x x坐标
 * @param y y坐标
 * @returns {Konva.Group} summary组
 */
export const createSummaryLeftGroup = (x: number, y: number) => createGroup('summary', 'left', x, y)
/**
 * 创建summary中间组
 * @param x x坐标
 * @param y y坐标
 * @returns {Konva.Group} summary组
 */
export const createSummaryCenterGroup = (x: number, y: number) => createGroup('summary', 'center', x, y)
/**
 * 创建summary右侧组
 * @param x x坐标
 * @param y y坐标
 * @returns {Konva.Group} summary组
 */
export const createSummaryRightGroup = (x: number, y: number) => createGroup('summary', 'right', x, y)
/**
 * 创建summary裁剪组
 * @param x x坐标
 * @param y y坐标
 * @param {Object} clipOptions - 裁剪区域宽度高度
 * @returns {Konva.Group} summary组
 */
export const createSummaryClipGroup = (x: number, y: number, clipOptions: ClipOptions) =>
  createGroup('summary', 'center', x, y, clipOptions)

/**
 * 获取汇总行高度
 * @returns {number}
 */
export const getSummaryRowHeight = () => (getTableParams().enableSummary ? getTableParams().summaryRowHeight : 0)

export const getSummaryRules = () => getRuntimeState().summaryRules

/**
 * 重置汇总状态
 */
export const resetSummaryState = () => {
  const summaryRules = getSummaryRules()
  Object.keys(summaryRules).forEach((key) => {
    delete summaryRules[key]
  })
}

/**
 * 计算某列的汇总显示值
 * @param {CanvasTable.DimensionOption | CanvasTable.MeasureOption} col - 列
 * @param {string} rule - 规则
 * @returns {string} 汇总显示值
 */
const computeSummaryValueForColumn = (col: CanvasTable.DimensionOption | CanvasTable.MeasureOption, rule: string) => {
  if (rule === 'nodisplay') return '不显示'
  const key = col.columnName
  const values = getProcessedRows().value.map((r) => r?.[key])
  const isNumber = values.some((v) => typeof v === 'number')
  if (isNumber) {
    const nums = values
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((v) => Number.isFinite(v)) as number[]
    if (nums.length === 0) return ''
    switch (rule) {
      case 'max':
        return String(Math.max(...nums))
      case 'min':
        return String(Math.min(...nums))
      case 'avg': {
        const sum = nums.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
        const avg = sum / nums.length
        return String(Number.isFinite(avg) ? Number(avg.toFixed(4)) : '')
      }
      case 'sum': {
        const sum = nums.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
        return String(Number.isFinite(sum) ? sum : '')
      }
      default:
        return ''
    }
  } else {
    const filled = values.filter((v) => v !== null && v !== undefined && String(v) !== '').length
    const empty = values.length - filled
    switch (rule) {
      case 'filled':
        return String(filled)
      case 'nofilled':
        return String(empty)
      default:
        return ''
    }
  }
}

/**
 * 汇总规则的中文标签
 * @param {string} rule - 汇总规则
 * @returns {string} 汇总规则的中文标签
 */
const getRuleLabel = (rule: string) => {
  switch (rule) {
    case 'max':
      return '最大'
    case 'min':
      return '最小'
    case 'avg':
      return '平均'
    case 'sum':
      return '求和'
    case 'filled':
      return '已填写'
    case 'nofilled':
      return '未填写'
    default:
      return ''
  }
}

/**
 * 绘制汇总部分（固定在底部，风格与表头一致，但使用 bodyTextColor）
 * @param {Konva.Group | null} summaryGroup - 分组
 * @param {Array<CanvasTable.DimensionOption | CanvasTable.MeasureOption>} summaryCols - 列
 */
export const drawSummaryPart = (
  summaryGroup: Konva.Group | null,
  summaryCols: Array<CanvasTable.DimensionOption | CanvasTable.MeasureOption>
) => {
  if (!summaryGroup || !stageVars.stage) return
  const summaryRowHeight = getTableParams().summaryRowHeight
  const summaryBackground = getTableParams().summaryBackground
  const borderColor = getTableParams().borderColor
  const summaryFontFamily = getTableParams().summaryFontFamily
  const summaryTextColor = getTableParams().summaryTextColor
  const fontSize = getTableParams().summaryFontSize

  let x = 0
  summaryCols.forEach((columnOption) => {
    const colWidth = columnOption.width

    // 使用统一函数创建汇总行矩形
    const summaryCellRect = drawUnifiedRect({
      name: 'summary-cell-rect',
      x,
      y: 0,
      width: colWidth,
      height: summaryRowHeight,
      fill: summaryBackground,
      stroke: borderColor,
      strokeWidth: 1,
      listening: true,
      group: summaryGroup
    })

    const textMaxWidth = calculateTextWidth.forSummaryCell(columnOption)

    // 先显示占位文本，然后异步更新
    const rule = getSummaryRules()[columnOption.columnName] || 'nodisplay'
    const placeholderText = rule === 'nodisplay' ? '不显示' : '计算中...'
    const truncatedTitle = truncateText(
      placeholderText,
      textMaxWidth,
      getTableParams().summaryFontSize,
      summaryFontFamily
    )

    // 使用统一函数创建汇总行文本
    const summaryCellText = drawUnifiedText({
      name: 'summary-cell-text',
      text: truncatedTitle,
      x,
      y: 0,
      width: colWidth,
      height: summaryRowHeight,
      fontSize,
      fontFamily: summaryFontFamily,
      fill: summaryTextColor,
      align: columnOption.align,
      verticalAlign: columnOption.verticalAlign,
      group: summaryGroup
    })

    if (rule !== 'nodisplay') {
      const summaryText = computeSummaryValueForColumn(columnOption, rule)
      const ruleLabel = getRuleLabel(rule)
      const displayText = ruleLabel ? `${ruleLabel}: ${summaryText}` : summaryText
      const finalText = truncateText(displayText, textMaxWidth, getTableParams().summaryFontSize, summaryFontFamily)
      summaryCellText.text(finalText)
    }
    // 注释悬停效果以提升性能
    summaryCellRect.on(
      'mouseenter',
      bindCurrentTableContext(() => setPointerStyle(stageVars.stage, true, 'pointer'))
    )
    summaryCellRect.on(
      'mouseleave',
      bindCurrentTableContext(() => setPointerStyle(stageVars.stage, false, 'default'))
    )
    summaryCellRect.on(
      'click',
      bindCurrentTableContext((evt: KonvaEventObject<MouseEvent, Konva.Rect>) => {
        if (!stageVars.stage) return
        if (!summaryDropdownRef.value) return
        const isNumber = columnOption.columnType === 'number'
        const options = isNumber ? numberOptions : textOptions
        const prev = getSummaryRules()[columnOption.columnName] || 'nodisplay'
        const valid = options.some((o) => o.value === prev) ? prev : 'nodisplay'
        summaryDropdownRef.value?.openSummaryDropdown(evt, columnOption.columnName, options, valid)
      })
    )

    x += colWidth
  })
}
