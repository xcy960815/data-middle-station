import Konva from 'konva'
import type { ExtractPropTypes } from 'vue'
import { summaryDropDownHandler } from '../dropdown/summary-dropdown-handler'
import { konvaStageHandler } from '../konva-stage-handler'
import { chartProps } from '../props'
import { truncateText } from '../utils'
import type { PositionMap, Prettify } from '../variable-handlder'
import { numberOptions, textOptions, variableHandlder } from '../variable-handlder'
import { drawUnifiedRect, drawUnifiedText } from './draw'
interface RenderSummaryHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}

export const renderSummaryHandler = ({ props }: RenderSummaryHandlerProps) => {
  const { tableData, summaryState, tableVars } = variableHandlder({ props })
  const { setPointerStyle } = konvaStageHandler({ props })
  const { openSummaryDropdown } = summaryDropDownHandler({ props })
  const { $webworker } = useNuxtApp()
  /**
   * 计算某列的汇总显示值（异步版本）
   * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} col 列
   * @param {string} rule 规则
   * @returns {string} 汇总显示值
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
            const result = await $webworker.run<number>(fn)
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
            const result = await $webworker.run<number>(fn)
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
   * @param {string} rule 汇总规则
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
   * 统一调度一次重绘，避免异步多次 batchDraw 造成抖动
   * @param {Konva.Layer | null} layer 层
   */
  let drawingScheduled = false

  const scheduleBatchDraw = (layer?: Konva.Layer | null) => {
    if (drawingScheduled) return
    drawingScheduled = true
    requestAnimationFrame(() => {
      drawingScheduled = false
      layer?.batchDraw()
    })
  }
  /**
   * 绘制汇总部分（固定在底部，风格与表头一致，但使用 bodyTextColor）
   * @param {Konva.Group | null} group 分组
   * @param {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>} cols 列
   * @param {number} startColIndex 起始列索引
   */
  const drawSummaryPart = (
    summaryGroup: Konva.Group | null,
    summaryCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    startColIndex: number,
    positionMapList: PositionMap[],
    stageStartX: number
  ) => {
    if (!tableVars.stage || !summaryGroup) return
    const stage = tableVars.stage
    const summaryHeight = props.summaryHeight
    const summaryBackground = props.summaryBackground
    const borderColor = props.borderColor
    const summaryFontFamily = props.summaryFontFamily
    const summaryTextColor = props.summaryTextColor
    const fontSizeNumber =
      typeof props.summaryFontSize === 'string' ? parseFloat(props.summaryFontSize) : props.summaryFontSize
    const realRowIndex = tableData.value.length + 1
    const summaryY = stage.height() - summaryHeight

    let x = 0
    summaryCols.forEach((col, colIndex) => {
      const pools = tableVars.leftBodyPools
      const realColIndex = colIndex + startColIndex
      const summaryCellRect = drawUnifiedRect({
        pools,
        name: 'summary-cell-rect',
        x,
        y: 0,
        width: col.width || 0,
        height: summaryHeight,
        fill: summaryBackground,
        stroke: borderColor,
        strokeWidth: 1,
        listening: true,
        rowIndex: realRowIndex,
        colIndex: realColIndex,
        originFill: summaryBackground
      })
      summaryGroup.add(summaryCellRect)

      const colWidth = col.width || 0
      const textMaxWidth = colWidth - 16
      // 记录汇总单元格位置信息（使用舞台坐标）
      positionMapList.push({
        x: stageStartX + x,
        y: summaryY,
        width: colWidth,
        height: summaryHeight,
        rowIndex: realRowIndex,
        colIndex: realColIndex
      })

      // 先显示占位文本，然后异步更新
      const rule = summaryState[col.columnName] || 'nodisplay'
      const placeholderText = rule === 'nodisplay' ? '不显示' : '计算中...'
      const truncatedTitle = truncateText(placeholderText, textMaxWidth, props.summaryFontSize, summaryFontFamily)
      const summaryCellText = drawUnifiedText({
        pools,
        name: 'summary-cell-text',
        text: truncatedTitle,
        x,
        y: 0,
        fontSize: fontSizeNumber,
        fontFamily: summaryFontFamily,
        fill: summaryTextColor,
        align: col.align || 'left',
        verticalAlign: 'middle',
        cellHeight: summaryHeight,
        useGetTextX: true
      })
      summaryGroup.add(summaryCellText)

      // 异步计算汇总值并更新文本
      if (rule !== 'nodisplay') {
        computeSummaryValueForColumn(col, rule).then((summaryText) => {
          const ruleLabel = getRuleLabel(rule)
          const displayText = ruleLabel ? `${ruleLabel}: ${summaryText}` : summaryText
          const finalText = truncateText(displayText, textMaxWidth, props.summaryFontSize, summaryFontFamily)
          summaryCellText.text(finalText)
          const layer = summaryGroup.getLayer()
          scheduleBatchDraw(layer)
        })
      }
      summaryCellRect.on('mouseenter', () => setPointerStyle(true, 'pointer'))
      summaryCellRect.on('mouseleave', () => setPointerStyle(false, 'default'))

      summaryCellRect.on('click', (evt) => {
        if (!tableVars.stage) return
        const isNumber = col.columnType === 'number'
        const options = isNumber ? numberOptions : textOptions
        const prev = summaryState[col.columnName] || 'nodisplay'
        const valid = options.some((o) => o.value === prev) ? prev : 'nodisplay'
        openSummaryDropdown(evt, col.columnName, options, valid)
      })

      x += colWidth
    })
  }
  return {
    drawSummaryPart
  }
}
