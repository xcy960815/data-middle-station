import Konva from 'konva'
import { reactive, ref } from 'vue'
// import { webworker } from '@/composables/useWebworker';
import type { KonvaEventObject } from 'konva/lib/Node'
import SummaryDropdown from './components/summary-dropdown.vue'
import { staticParams, tableData } from './parameter'
import { stageVars } from './stage-handler'
import { createGroup, drawUnifiedRect, drawUnifiedText, setPointerStyle, truncateText } from './utils'
const webworker = useNuxtApp().$webworker
interface SummaryVars {
  summaryLayer: Konva.Layer | null
  leftSummaryGroup: Konva.Group | null
  centerSummaryGroup: Konva.Group | null
  rightSummaryGroup: Konva.Group | null
}

export const summaryVars: SummaryVars = {
  /**
   * 汇总层（汇总）
   */
  summaryLayer: null,
  /**
   * 左侧汇总组（左侧汇总）
   */
  leftSummaryGroup: null,
  /**
   * 中间汇总组（中间汇总）
   */
  centerSummaryGroup: null,
  /**
   * 右侧汇总组（右侧汇总）
   */
  rightSummaryGroup: null
}

/**
 * 汇总下拉组件引用
 */
export const summaryDropdownRef = ref<InstanceType<typeof SummaryDropdown> | null>(null)

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
export const getSummaryRowHeight = () => (staticParams.enableSummary ? staticParams.summaryRowHeight : 0)

/**
 * 汇总行选择状态：列名 -> 选中的规则 - 单独的响应式变量
 */
export const summaryState = reactive<Record<string, string>>({})

/**
 * 计算某列的汇总显示值
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} col - 列
 * @param {string} rule - 规则
 * @returns {Promise<string>} 汇总显示值
 */
const computeSummaryValueForColumn = async (
  col: GroupStore.GroupOption | DimensionStore.DimensionOption,
  rule: string
) => {
  if (rule === 'nodisplay') return '不显示'
  const key = col.columnName
  const values = tableData.value.map((r) => r?.[key])
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
        // 使用 webworker 参与计算，避免大数据量时阻塞主线程
        try {
          const fn = new Function(
            `const nums = ${JSON.stringify(nums)}; const s = nums.reduce((a,b)=>a+b,0); return s / nums.length;`
          ) as () => number
          const result = await webworker.run<number>(fn)
          const avg = result && result.success ? result.data : nums.reduce((a, b) => a + b, 0) / nums.length
          return String(Number.isFinite(avg) ? Number(avg.toFixed(4)) : '')
        } catch {
          const s = nums.reduce((a, b) => a + b, 0)
          const avg = s / nums.length
          return String(Number.isFinite(avg) ? Number(avg.toFixed(4)) : '')
        }
      }
      case 'sum': {
        // 使用 webworker 参与计算，避免大数据量时阻塞主线程
        try {
          const fn = new Function(
            `const nums = ${JSON.stringify(nums)}; return nums.reduce((a,b)=>a+b,0);`
          ) as () => number
          const result = await webworker.run<number>(fn)
          const s = result && result.success ? result.data : nums.reduce((a, b) => a + b, 0)
          return String(Number.isFinite(s) ? s : '')
        } catch {
          const s = nums.reduce((a, b) => a + b, 0)
          return String(Number.isFinite(s) ? s : '')
        }
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
 * @param {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>} summaryCols - 列
 */
export const drawSummaryPart = (
  summaryGroup: Konva.Group | null,
  summaryCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>
) => {
  if (!summaryGroup) return
  const summaryRowHeight = staticParams.summaryRowHeight
  const summaryBackground = staticParams.summaryBackground
  const borderColor = staticParams.borderColor
  const summaryFontFamily = staticParams.summaryFontFamily
  const summaryTextColor = staticParams.summaryTextColor
  const fontSize = staticParams.summaryFontSize

  let x = 0
  summaryCols.forEach((col) => {
    const colWidth = col.width || 0

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

    const textMaxWidth = colWidth - 16

    // 先显示占位文本，然后异步更新
    const rule = summaryState[col.columnName] || 'nodisplay'
    const placeholderText = rule === 'nodisplay' ? '不显示' : '计算中...'
    const truncatedTitle = truncateText(placeholderText, textMaxWidth, staticParams.summaryFontSize, summaryFontFamily)

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
      align: col.align ?? 'left',
      verticalAlign: col.verticalAlign ?? 'middle',
      group: summaryGroup
    })

    // 异步计算汇总值并更新文本
    if (rule !== 'nodisplay') {
      computeSummaryValueForColumn(col, rule).then((summaryText) => {
        const ruleLabel = getRuleLabel(rule)
        const displayText = ruleLabel ? `${ruleLabel}: ${summaryText}` : summaryText
        const finalText = truncateText(displayText, textMaxWidth, staticParams.summaryFontSize, summaryFontFamily)
        summaryCellText.text(finalText)
        const layer = summaryGroup.getLayer()
        layer?.batchDraw()
      })
    }
    // 注释悬停效果以提升性能
    summaryCellRect.on('mouseenter', () => setPointerStyle(stageVars.stage, true, 'pointer'))
    summaryCellRect.on('mouseleave', () => setPointerStyle(stageVars.stage, false, 'default'))
    summaryCellRect.on('click', (evt: KonvaEventObject<MouseEvent, Konva.Rect>) => {
      if (!stageVars.stage) return
      if (!summaryDropdownRef.value) return
      const isNumber = col.columnType === 'number'
      const options = isNumber ? numberOptions : textOptions
      const prev = summaryState[col.columnName] || 'nodisplay'
      const valid = options.some((o) => o.value === prev) ? prev : 'nodisplay'
      summaryDropdownRef.value?.openSummaryDropdown(evt, col.columnName, options, valid)
    })

    x += colWidth
  })
}
