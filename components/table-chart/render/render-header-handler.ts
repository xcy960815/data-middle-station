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
  // 添加排序功能支持
  const { tableData, handleTableData, filterState, tableVars, handleHeaderSort, getColumnSortOrder } = variableHandlder(
    { props }
  )
  const { clearGroups } = konvaStageHandler({ props })
  const { setPointerStyle } = konvaStageHandler({ props })

  /**
   * 创建表头单元格矩形 - 添加排序功能
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
    const sortOrder = getColumnSortOrder(col.columnName)
    const isSorted = sortOrder !== null

    const rect = drawUnifiedRect({
      pools,
      name: 'header-cell-rect',
      x,
      y,
      width,
      height,
      fill: isSorted ? props.headerSortActiveBackground : props.headerBackground,
      stroke: props.borderColor,
      strokeWidth: 1,
      rowIndex: 0,
      colIndex: colIndex + startColIndex,
      originFill: isSorted ? props.headerSortActiveBackground : props.headerBackground
    })

    // 添加点击事件
    rect.on('click', () => {
      handleHeaderSort(col.columnName)
    })

    // 添加悬停效果
    rect.on('mouseenter', () => {
      rect.fill(isSorted ? props.headerSortActiveBackground : '#f0f0f0')
      setPointerStyle(true, 'pointer')
      const layer = bodyGroup.getLayer()
      layer?.batchDraw()
    })

    rect.on('mouseleave', () => {
      rect.fill(isSorted ? props.headerSortActiveBackground : props.headerBackground)
      setPointerStyle(false, 'default')
      const layer = bodyGroup.getLayer()
      layer?.batchDraw()
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
   * 创建排序指示器
   */
  const createSortIndicator = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    x: number,
    y: number,
    width: number,
    height: number,
    bodyGroup: Konva.Group
  ) => {
    console.log('createSortIndicator')

    const sortOrder = getColumnSortOrder(col.columnName)
    if (!sortOrder) return null

    const pools = tableVars.leftBodyPools
    const arrowSize = 8
    const arrowX = x + width - arrowSize - 8
    const arrowY = y + height / 2

    // 创建箭头路径
    const arrowPath =
      sortOrder === 'asc'
        ? `M ${arrowX} ${arrowY + 2} L ${arrowX + arrowSize / 2} ${arrowY - 2} L ${arrowX + arrowSize} ${arrowY + 2} Z`
        : `M ${arrowX} ${arrowY - 2} L ${arrowX + arrowSize / 2} ${arrowY + 2} L ${arrowX + arrowSize} ${arrowY - 2} Z`

    const arrow = new Konva.Path({
      data: arrowPath,
      fill: props.sortableColor,
      name: 'sort-indicator'
    })

    bodyGroup.add(arrow)
    return arrow
  }

  /**
   * 创建表头文本 - 添加排序支持
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
    const sortOrder = getColumnSortOrder(col.columnName)
    const hasSort = sortOrder !== null

    // 如果有排序，给文本留出箭头空间
    const maxTextWidth = hasSort ? width - 32 : width - 16
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

    // 添加排序指示器
    createSortIndicator(col, x, y, width, height, bodyGroup)

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
      } else if (child instanceof Konva.Path && child.name() === 'sort-indicator') {
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
