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

    // 添加点击事件 - 只有可排序的列才能点击排序
    rect.on('click', () => {
      if (col.sortable) {
        handleHeaderSort(col.columnName)
      }
    })

    // 添加悬停效果 - 只有可排序的列才显示交互效果
    rect.on('mouseenter', () => {
      if (col.sortable) {
        rect.fill(isSorted ? props.headerSortActiveBackground : '#f0f0f0')
        setPointerStyle(true, 'pointer')
      }
      const layer = bodyGroup.getLayer()
      layer?.batchDraw()
    })

    rect.on('mouseleave', () => {
      if (col.sortable) {
        rect.fill(isSorted ? props.headerSortActiveBackground : props.headerBackground)
        setPointerStyle(false, 'default')
      }
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
    // 检查列是否可排序
    if (!col.sortable) {
      return
    }
    // 箭头尺寸 8px
    const arrowSize = 8
    // 箭头位置 x + width - arrowSize - 8
    const arrowX = x + width - arrowSize - 8
    // 箭头位置 y + height / 2
    const arrowY = y + height / 2
    const sortOrder = getColumnSortOrder(col.columnName)
    // 创建箭头指向
    const arrowPointTo =
      sortOrder === 'asc'
        ? `M ${arrowX} ${arrowY + 2} L ${arrowX + arrowSize / 2} ${arrowY - 2} L ${arrowX + arrowSize} ${arrowY + 2} Z`
        : sortOrder === 'desc'
          ? `M ${arrowX} ${arrowY - 2} L ${arrowX + arrowSize / 2} ${arrowY + 2} L ${arrowX + arrowSize} ${arrowY - 2} Z`
          : ''

    const arrowPointToPath = new Konva.Path({
      data: arrowPointTo,
      fill: props.sortableColor,
      name: 'sort-indicator'
    })

    bodyGroup.add(arrowPointToPath)

    return arrowPointToPath
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

      // 添加排序指示器
      createSortIndicator(col, x, 0, columnWidth, props.headerHeight, headerGroup)

      x += columnWidth
    }
  }

  return {
    drawHeaderPart
  }
}
