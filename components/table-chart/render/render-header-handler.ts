import Konva from 'konva'
import { filterDropdownHandler } from '../dropdown/filter-dropdown-handler'
import { konvaStageHandler } from '../konva-stage-handler'
import type { chartProps } from '../props'
import { getTextX, truncateText } from '../utils'
import type { PositionMap, Prettify } from '../variable-handlder'
import { variableHandlder } from '../variable-handlder'

// 常量定义
const LAYOUT_CONSTANTS = {
  ICON_AREA_WIDTH: 40, // 右侧图标区域预留宽度
  SORT_ARROW_OFFSET: 34, // 排序箭头距离右边缘的距离
  FILTER_ICON_OFFSET: 12, // 过滤图标距离右边缘的距离
  RESIZER_WIDTH: 6, // 列宽调整手柄宽度
  ARROW_SIZE: 5, // 排序箭头大小
  ARROW_GAP: 2, // 上下箭头间距
  FILTER_ICON_SIZE: 16 // 过滤图标大小
} as const

const COLORS = {
  INACTIVE: '#C0C4CC' // 非激活状态颜色
} as const

interface RenderHeaderHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}

export const renderHeaderHandler = ({ props }: RenderHeaderHandlerProps) => {
  const { openFilterDropdown } = filterDropdownHandler({ props })
  const { sortColumns, tableData, handleTableData, filterState, tableVars } = variableHandlder({ props })
  const { clearGroups } = konvaStageHandler({ props })
  const { setPointerStyle } = konvaStageHandler({ props })
  /**
   * 创建表头单元格矩形
   */
  const createHeaderCell = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    x: number,
    colIndex: number,
    startColIndex: number
  ) => {
    const rect = new Konva.Rect({
      x,
      y: 0,
      name: 'header-cell-rect',
      width: col.width || 0,
      height: props.headerHeight,
      stroke: props.borderColor,
      strokeWidth: 1,
      listening: false
    })

    rect.setAttr('col-index', colIndex + startColIndex)
    rect.setAttr('row-index', 0)
    rect.setAttr('origin-fill', props.headerBackground)

    // 设置排序高亮背景
    const isSortColumn = sortColumns.value.find((s) => s.columnName === col.columnName)
    rect.fill(isSortColumn ? props.headerSortActiveBackground : props.headerBackground)

    return rect
  }

  /**
   * 创建表头文本
   */
  const createHeaderText = (col: GroupStore.GroupOption | DimensionStore.DimensionOption, x: number) => {
    const maxTextWidth = (col.width || 0) - LAYOUT_CONSTANTS.ICON_AREA_WIDTH
    const fontSize = typeof props.headerFontSize === 'string' ? parseFloat(props.headerFontSize) : props.headerFontSize
    const displayName = col.displayName || col.columnName
    const truncatedTitle = truncateText(displayName, maxTextWidth, fontSize, props.headerFontFamily)

    const text = new Konva.Text({
      x: getTextX(x),
      y: props.headerHeight / 2,
      text: truncatedTitle,
      fontSize,
      fontFamily: props.headerFontFamily,
      fill: props.headerTextColor,
      align: col.align || 'left',
      verticalAlign: 'middle',
      listening: false
    })

    text.offsetY(text.height() / 2)
    return text
  }

  /**
   * 处理排序逻辑
   */
  const handleSortAction = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    order: 'asc' | 'desc',
    hasModifier: boolean
  ) => {
    const currentIndex = sortColumns.value.findIndex((s) => s.columnName === col.columnName)

    if (hasModifier) {
      // 多列排序模式
      handleMultiColumnSort(col, order, currentIndex)
    } else {
      // 单列排序模式
      handleSingleColumnSort(col, order, currentIndex)
    }

    handleTableData(props.data)
    clearGroups()
    // 通过全局指针调用，避免 import 循环
    tableVars.rebuildGroupsFn && tableVars.rebuildGroupsFn()
  }

  /**
   * 多列排序处理
   */
  const handleMultiColumnSort = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    order: 'asc' | 'desc',
    currentIndex: number
  ) => {
    if (currentIndex === -1) {
      // 添加新的排序列
      sortColumns.value = [...sortColumns.value, { columnName: col.columnName, order }]
    } else {
      const newSortColumns = [...sortColumns.value]
      if (newSortColumns[currentIndex].order === order) {
        // 移除该列的排序
        newSortColumns.splice(currentIndex, 1)
      } else {
        // 切换排序方向
        newSortColumns[currentIndex] = { columnName: col.columnName, order }
      }
      sortColumns.value = newSortColumns
    }
  }

  /**
   * 单列排序处理
   */
  const handleSingleColumnSort = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    order: 'asc' | 'desc',
    currentIndex: number
  ) => {
    if (currentIndex === -1) {
      // 设置新的排序
      sortColumns.value = [{ columnName: col.columnName, order }]
    } else if (sortColumns.value[currentIndex].order === order) {
      // 取消排序
      sortColumns.value = []
    } else {
      // 切换排序方向
      sortColumns.value = [{ columnName: col.columnName, order }]
    }
  }

  /**
   * 创建排序箭头
   */
  const createSortArrows = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    x: number,
    centerY: number
  ) => {
    const foundSort = sortColumns.value.find((s) => s.columnName === col.columnName)
    const upColor = foundSort?.order === 'asc' ? props.sortableColor : COLORS.INACTIVE
    const downColor = foundSort?.order === 'desc' ? props.sortableColor : COLORS.INACTIVE
    const arrowX = x + (col.width || 0) - LAYOUT_CONSTANTS.SORT_ARROW_OFFSET

    const upTriangle = new Konva.RegularPolygon({
      x: arrowX,
      y: centerY - (LAYOUT_CONSTANTS.ARROW_SIZE + LAYOUT_CONSTANTS.ARROW_GAP) / 2,
      sides: 3,
      radius: LAYOUT_CONSTANTS.ARROW_SIZE,
      rotation: 0,
      fill: upColor,
      listening: true
    })

    const downTriangle = new Konva.RegularPolygon({
      x: arrowX,
      y: centerY + (LAYOUT_CONSTANTS.ARROW_SIZE + LAYOUT_CONSTANTS.ARROW_GAP) / 2,
      sides: 3,
      radius: LAYOUT_CONSTANTS.ARROW_SIZE,
      rotation: 180,
      fill: downColor,
      listening: true
    })

    // 添加鼠标交互
    const setupArrowInteraction = (arrow: Konva.RegularPolygon, order: 'asc' | 'desc') => {
      arrow.on('mouseenter', () => setPointerStyle(true, 'pointer'))
      arrow.on('mouseleave', () => setPointerStyle(false, 'default'))
      arrow.on('click', (evt) => {
        if (tableVars.isResizingColumn) return
        const hasModifier = !!(evt.evt && (evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey))
        handleSortAction(col, order, hasModifier)
      })
    }

    setupArrowInteraction(upTriangle, 'asc')
    setupArrowInteraction(downTriangle, 'desc')

    return { upTriangle, downTriangle }
  }

  /**
   * 创建过滤图标
   */
  const createFilterIcon = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    x: number,
    centerY: number
  ) => {
    const hasFilter = !!(filterState[col.columnName] && filterState[col.columnName].size > 0)
    const filterColor = hasFilter ? props.sortableColor : COLORS.INACTIVE
    const filterX = x + (col.width || 0) - LAYOUT_CONSTANTS.FILTER_ICON_OFFSET
    const iconSize = LAYOUT_CONSTANTS.FILTER_ICON_SIZE

    const filterIcon = new Konva.Shape({
      x: filterX - iconSize / 2,
      y: centerY - iconSize / 2,
      width: iconSize,
      height: iconSize,
      listening: true,
      name: `filter-icon-${col.columnName}`,
      sceneFunc: (context, shape) => {
        context.beginPath()
        // 漏斗形状路径
        context.moveTo(2, 2)
        context.lineTo(14, 2)
        context.lineTo(11, 7)
        context.lineTo(11, 12)
        context.lineTo(5, 12)
        context.lineTo(5, 7)
        context.closePath()
        context.fillStrokeShape(shape)
      },
      stroke: filterColor,
      strokeWidth: 1.5,
      fill: hasFilter ? filterColor : 'transparent'
    })

    // 添加鼠标交互
    filterIcon.on('mouseenter', () => setPointerStyle(true, 'pointer'))
    filterIcon.on('mouseleave', () => setPointerStyle(false, 'default'))
    filterIcon.on('click', (evt) => {
      const uniqueValues = new Set<string>()
      tableData.value.forEach((row) => uniqueValues.add(String(row[col.columnName] ?? '')))

      const availableOptions = Array.from(uniqueValues)
      const currentSelection = filterState[col.columnName] ? Array.from(filterState[col.columnName]!) : []
      const allOptions = Array.from(new Set([...availableOptions, ...currentSelection]))

      openFilterDropdown(evt, col.columnName, allOptions, currentSelection)
    })

    return filterIcon
  }

  /**
   * 创建列宽调整手柄
   */
  const createColumnResizer = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    x: number,
    colIndex: number
  ) => {
    const resizer = new Konva.Rect({
      x: x + (col.width || 0) - LAYOUT_CONSTANTS.RESIZER_WIDTH / 2,
      y: 0,
      width: LAYOUT_CONSTANTS.RESIZER_WIDTH,
      height: props.headerHeight,
      fill: 'transparent',
      listening: true,
      draggable: false,
      name: `col-resizer-${col.columnName}`
    })

    // 添加鼠标交互
    resizer.on('mouseenter', () => setPointerStyle(true, 'col-resize'))
    resizer.on('mouseleave', () => {
      if (!tableVars.isResizingColumn) {
        setPointerStyle(false, 'default')
      }
    })

    resizer.on('mousedown', (evt) => {
      tableVars.isResizingColumn = true
      tableVars.resizingColumnName = col.columnName
      tableVars.resizeStartX = evt.evt.clientX
      tableVars.resizeStartWidth = col.width || 0

      // 设置相邻列信息
      const neighborColumn = headerCols[colIndex + 1]
      if (neighborColumn) {
        tableVars.resizeNeighborColumnName = neighborColumn.columnName
        tableVars.resizeNeighborStartWidth = neighborColumn.width || 0
      } else {
        tableVars.resizeNeighborColumnName = null
        tableVars.resizeNeighborStartWidth = 0
      }

      setPointerStyle(true, 'col-resize')
    })

    return resizer
  }

  /**
   * 绘制单个表头列
   */
  const drawSingleColumn = (
    headerGroup: Konva.Group,
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    x: number,
    colIndex: number,
    startColIndex: number,
    positionMapList: PositionMap[],
    stageStartX: number
  ) => {
    // 创建表头单元格
    const headerCell = createHeaderCell(col, x, colIndex, startColIndex)
    headerGroup.add(headerCell)

    // 记录位置信息
    positionMapList.push({
      x: stageStartX + x,
      y: 0,
      width: col.width || 0,
      height: props.headerHeight,
      rowIndex: 0,
      colIndex: colIndex + startColIndex
    })

    // 创建表头文本
    const headerText = createHeaderText(col, x)
    headerGroup.add(headerText)

    const centerY = props.headerHeight / 2

    // 添加排序功能
    if (col.sortable) {
      const { upTriangle, downTriangle } = createSortArrows(col, x, centerY)
      headerGroup.add(upTriangle)
      headerGroup.add(downTriangle)
    }

    // 添加过滤功能
    if (col.filterable) {
      const filterIcon = createFilterIcon(col, x, centerY)
      headerGroup.add(filterIcon)
    }

    // 添加列宽调整功能
    const resizer = createColumnResizer(col, headerCols, x, colIndex)
    headerGroup.add(resizer)
  }

  /**
   * 绘制表头部分
   */
  const drawHeaderPart = (
    headerGroup: Konva.Group | null,
    headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    startColIndex: number,
    positionMapList: PositionMap[],
    stageStartX: number
  ) => {
    if (!headerGroup) return

    let currentX = 0
    headerCols.forEach((col, colIndex) => {
      drawSingleColumn(headerGroup, col, headerCols, currentX, colIndex, startColIndex, positionMapList, stageStartX)
      currentX += col.width || 0
    })
  }

  return {
    drawHeaderPart
  }
}
