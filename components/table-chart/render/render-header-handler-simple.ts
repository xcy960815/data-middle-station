import Konva from 'konva'
import { konvaStageHandler } from '../konva-stage-handler'
import type { chartProps } from '../props'
import { truncateText } from '../utils'
import type { PositionMap, Prettify } from '../variable-handlder'
import { variableHandlder } from '../variable-handlder'
import { drawUnifiedRect, drawUnifiedText } from './draw'

const COLORS = {
  INACTIVE: '#d0d7de'
}

interface RenderHeaderHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}

export const renderHeaderHandler = ({ props }: RenderHeaderHandlerProps) => {
  // 注释所有复杂功能以提升性能
  const { tableData, handleTableData, filterState, tableVars } = variableHandlder({ props })
  const { clearGroups } = konvaStageHandler({ props })
  const { setPointerStyle } = konvaStageHandler({ props })

  /**
   * 创建表头单元格矩形 - 简化版本
   */
  const createHeaderCellRect = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    x: number,
    y: number,
    width: number,
    height: number,
    bodyGroup: Konva.Group,
    positionMapList: PositionMap[],
    startColIndex: number,
    colIndex: number
  ) => {
    const pools = tableVars.leftBodyPools
    const rect = drawUnifiedRect({
      pools,
      name: 'header-cell-rect',
      x,
      y,
      width,
      height,
      fill: props.headerBackground,
      stroke: props.borderColor,
      strokeWidth: 1,
      rowIndex: 0,
      colIndex: colIndex + startColIndex,
      originFill: props.headerBackground
    })
    bodyGroup.add(rect)

    // 记录位置信息
    positionMapList.push({
      x,
      y,
      width,
      height,
      rowIndex: 0,
      colIndex: colIndex + startColIndex
    })

    return rect
  }

  /**
   * 创建表头文本 - 简化版本
   */
  const createHeaderCellText = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    x: number,
    y: number,
    width: number,
    height: number,
    bodyGroup: Konva.Group
  ) => {
    const pools = tableVars.leftBodyPools
    const maxTextWidth = width - 16
    const text = truncateText(col.columnName, maxTextWidth, props.headerFontSize, props.headerFontFamily)

    const headerText = drawUnifiedText({
      pools,
      name: 'header-cell-text',
      text,
      x,
      y,
      fontSize: props.headerFontSize,
      fontFamily: props.headerFontFamily,
      fill: props.headerTextColor,
      align: 'left',
      verticalAlign: 'middle',
      cellHeight: height,
      useGetTextX: true
    })
    bodyGroup.add(headerText)
    return headerText
  }

  /**
   * 绘制表头部分 - 极简版本
   */
  const drawHeaderPart = (
    headerGroup: Konva.Group | null,
    headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    startColIndex: number,
    positionMapList: PositionMap[],
    stageStartX: number
  ) => {
    if (!headerGroup || !tableVars.stage) return

    const pools = tableVars.leftBodyPools
    // 清空现有内容
    const children = headerGroup.children.slice()
    children.forEach((child) => {
      if (child instanceof Konva.Text && child.name() === 'header-cell-text') {
        child.remove()
      } else if (child instanceof Konva.Rect && child.name() === 'header-cell-rect') {
        child.remove()
      }
    })

    // 绘制简化的表头
    let x = 0
    for (let colIndex = 0; colIndex < headerCols.length; colIndex++) {
      const col = headerCols[colIndex]
      const columnWidth = col.width || 0

      if (columnWidth <= 0) {
        x += columnWidth
        continue
      }

      // 创建背景矩形
      createHeaderCellRect(
        col,
        x,
        0,
        columnWidth,
        props.headerHeight,
        headerGroup,
        positionMapList,
        startColIndex,
        colIndex
      )

      // 创建文本
      createHeaderCellText(col, x, 0, columnWidth, props.headerHeight, headerGroup)

      x += columnWidth
    }
  }

  return {
    drawHeaderPart
  }
}
