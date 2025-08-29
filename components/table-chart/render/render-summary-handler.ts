import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { chartProps } from '../props'
import { getTextX, setPointerStyle, truncateText } from '../utils'
import { numberOptions, tableVars, textOptions, type PositionMap, type Prettify } from '../variable'

interface RenderSummaryHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
  summaryState: Record<string, string>
  activeData: ComputedRef<Array<ChartDataVo.ChartData>>
  openSummaryDropdown: (
    evt: KonvaEventObject<MouseEvent, Konva.Rect>,
    colName: string,
    options: Array<{ label: string; value: string }>,
    updateHoverRects: () => void,
    selected?: string
  ) => void
}

export const renderSummaryHandler = ({
  props,
  summaryState,
  activeData,
  openSummaryDropdown
}: RenderSummaryHandlerProps) => {
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
    const values = activeData.value.map((r) => r?.[key])
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
          const s = nums.reduce((a, b) => a + b, 0)
          const avg = s / nums.length
          return String(Number.isFinite(avg) ? Number(avg.toFixed(4)) : '')
        }
        case 'sum': {
          const s = await $webworker.run(() => nums.reduce((a, b) => a + b, 0))
          return String(Number.isFinite(s) ? Number(s) : '')
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
    // 计算汇总行总长度
    const summaryTotalWidth = summaryCols.reduce((acc, c) => acc + (c.width || 0), 0)
    const summaryBackgroundRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: summaryTotalWidth,
      height: props.summaryHeight,
      fill: props.summaryBackground
    })

    summaryGroup.add(summaryBackgroundRect)

    let x = 0
    summaryCols.forEach((col, colIndex) => {
      const summaryCellRect = new Konva.Rect({
        x,
        y: 0,
        width: col.width || 0,
        height: props.summaryHeight,
        fill: props.summaryBackground,
        stroke: props.borderColor,
        strokeWidth: 1,
        listening: true
      })
      const realRowIndex = activeData.value.length + 1
      const realColIndex = colIndex + startColIndex
      summaryCellRect.setAttr('col-index', realColIndex)
      summaryCellRect.setAttr('row-index', realRowIndex)
      summaryGroup.add(summaryCellRect)

      const y = tableVars.stage!.height() - props.summaryHeight
      // 记录汇总单元格位置信息（使用舞台坐标）
      positionMapList.push({
        x: stageStartX + x,
        y: y,
        width: col.width || 0,
        height: props.summaryHeight,
        rowIndex: realRowIndex,
        colIndex: realColIndex
      })

      // 先显示占位文本，然后异步更新
      const rule = summaryState[col.columnName] || 'nodisplay'
      const placeholderText = rule === 'nodisplay' ? '不显示' : '计算中...'
      const truncatedTitle = truncateText(
        placeholderText,
        (col.width || 0) - 16,
        props.summaryFontSize,
        props.summaryFontFamily
      )
      const fontSize =
        typeof props.summaryFontSize === 'string' ? parseFloat(props.summaryFontSize) : props.summaryFontSize
      const summaryCellText = new Konva.Text({
        x: getTextX(x),
        y: props.summaryHeight / 2,
        text: truncatedTitle,
        fontSize: fontSize,
        fontFamily: props.summaryFontFamily,
        fill: props.summaryTextColor,
        align: col.align || 'left',
        verticalAlign: 'middle',
        listening: false
      })
      summaryCellText.offsetY(summaryCellText.height() / 2)
      summaryGroup.add(summaryCellText)

      // 异步计算汇总值并更新文本
      if (rule !== 'nodisplay') {
        computeSummaryValueForColumn(col, rule).then((summaryText) => {
          // 获取汇总方式的中文名称
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
          const ruleLabel = getRuleLabel(rule)
          const displayText = ruleLabel ? `${ruleLabel}: ${summaryText}` : summaryText
          const finalText = truncateText(
            displayText,
            (col.width || 0) - 16,
            props.summaryFontSize,
            props.summaryFontFamily
          )
          summaryCellText.text(finalText)
          summaryGroup.getLayer()?.batchDraw()
        })
      }
      summaryCellRect.on('mouseenter', () => setPointerStyle(tableVars.stage, true, 'pointer'))
      summaryCellRect.on('mouseleave', () => setPointerStyle(tableVars.stage, false, 'default'))

      summaryCellRect.on('click', (evt) => {
        if (!tableVars.stage) return
        const isNumber = col.columnType === 'number'
        const options = isNumber ? numberOptions : textOptions
        const prev = summaryState[col.columnName] || 'nodisplay'
        const valid = options.some((o) => o.value === prev) ? prev : 'nodisplay'
        openSummaryDropdown(evt, col.columnName, options, () => { }, valid)
      })

      x += col.width || 0
    })
  }
  return {
    drawSummaryPart
  }
}
