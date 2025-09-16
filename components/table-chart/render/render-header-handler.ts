import Konva from 'konva'
import { filterDropdownHandler } from '../dropdown/filter-dropdown-handler'
import type { CanvasTableEmits } from '../emits'
import { konvaStageHandler } from '../konva-stage-handler'
import type { chartProps } from '../props'
import { truncateText } from '../utils'
import type { PositionMap, Prettify } from '../variable-handlder'
import { variableHandlder } from '../variable-handlder'
import { drawUnifiedRect, drawUnifiedText } from './draw'
// 常量定义
const LAYOUT_CONSTANTS = {
  ICON_AREA_WIDTH: 40, // 右侧图标区域预留宽度
  SORT_ARROW_OFFSET: 34, // 排序箭头距离右边缘的距离
  FILTER_ICON_OFFSET: 12, // 过滤图标距离右边缘的距离
  RESIZER_WIDTH: 6, // 列宽调整手柄宽度
  ARROW_SIZE: 8, // 排序箭头大小 (从5增加到8)
  ARROW_GAP: 2, // 上下箭头间距 (从2增加到3)
  FILTER_ICON_SIZE: 16 // 过滤图标大小
} as const

const COLORS = {
  INACTIVE: '#d0d7de'
}

interface RenderHeaderHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
  emits: <T extends keyof CanvasTableEmits>(event: T, ...args: CanvasTableEmits[T]) => void
}

export const renderHeaderHandler = ({ props, emits }: RenderHeaderHandlerProps) => {
  // 添加排序功能支持
  const { tableData, handleTableData, filterState, sortColumns, tableVars, handleHeaderSort, getColumnSortOrder } =
    variableHandlder({ props })
  const { clearGroups } = konvaStageHandler({ props })
  const { setPointerStyle } = konvaStageHandler({ props, emits })
  const { openFilterDropdown } = filterDropdownHandler({ props })

  /**
   * 创建表头单元格矩形 - 添加排序功能
   * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption 列
   * @param {number} x 列的x坐标
   * @param {number} y 列的y坐标
   * @param {number} width 列的宽度
   * @param {number} height 列的高度
   * @param {Konva.Group} headerGroup 表头组
   * @param {PositionMap[]} positionMapList 位置映射列表
   * @param {number} startColIndex 起始列索引
   * @param {number} colIndex 列索引
   * @returns {Konva.Rect} 表头单元格矩形
   */
  const createHeaderCellRect = (
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    x: number,
    y: number,
    width: number,
    height: number,
    headerGroup: Konva.Group,
    positionMapList: PositionMap[],
    startColIndex: number,
    colIndex: number
  ) => {
    const pools = tableVars.leftBodyPools
    const sortOrder = getColumnSortOrder(columnOption.columnName)
    const isSorted = sortOrder !== null

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

    headerGroup.add(rect)

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
   * 多列排序处理
   */
  const handleMultiColumnSort = (
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    order: 'asc' | 'desc',
    currentIndex: number
  ) => {
    if (currentIndex === -1) {
      // 添加新的排序列
      sortColumns.value = [...sortColumns.value, { columnName: columnOption.columnName, order }]
    } else {
      const newSortColumns = [...sortColumns.value]
      if (newSortColumns[currentIndex].order === order) {
        // 移除该列的排序
        newSortColumns.splice(currentIndex, 1)
      } else {
        // 切换排序方向
        newSortColumns[currentIndex] = { columnName: columnOption.columnName, order }
      }
      sortColumns.value = newSortColumns
    }
  }

  /**
   * 单列排序处理
   */
  const handleSingleColumnSort = (
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    order: 'asc' | 'desc',
    currentIndex: number
  ) => {
    if (currentIndex === -1) {
      // 设置新的排序
      sortColumns.value = [{ columnName: columnOption.columnName, order }]
    } else if (sortColumns.value[currentIndex].order === order) {
      // 取消排序
      sortColumns.value = []
    } else {
      // 切换排序方向
      sortColumns.value = [{ columnName: columnOption.columnName, order }]
    }
  }

  /**
   * 处理排序逻辑
   */
  const handleSortAction = (
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    order: 'asc' | 'desc',
    hasModifier: boolean
  ) => {
    const currentIndex = sortColumns.value.findIndex((s) => s.columnName === columnOption.columnName)

    if (hasModifier) {
      // 多列排序模式
      handleMultiColumnSort(columnOption, order, currentIndex)
    } else {
      // 单列排序模式
      handleSingleColumnSort(columnOption, order, currentIndex)
    }

    handleTableData(props.data)
    clearGroups()
    // 通过全局指针调用，避免 import 循环
    tableVars.rebuildGroupsFn && tableVars.rebuildGroupsFn()
  }

  /**
   * 创建排序指示器 - 上下两个箭头
   * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption 列
   * @param {number} x 列的x坐标
   * @param {number} y 列的y坐标
   * @param {number} width 列的宽度
   * @param {number} height 列的高度
   * @param {Konva.Group} headerGroup 表头组
   * @returns {Konva.Path} 排序指示器
   */
  const createSortIcon = (
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    x: number,
    y: number,
    width: number,
    height: number,
    headerGroup: Konva.Group
  ) => {
    // 检查列是否可排序
    if (!columnOption.sortable) {
      return
    }

    const sortOrder = getColumnSortOrder(columnOption.columnName)

    // 箭头的基础位置
    const arrowX = x + width - LAYOUT_CONSTANTS.SORT_ARROW_OFFSET
    const centerY = y + height / 2

    // 上箭头（升序）- 指向上方的三角形
    const upArrowY = centerY - LAYOUT_CONSTANTS.ARROW_GAP / 2 - LAYOUT_CONSTANTS.ARROW_SIZE
    const upArrowPath = `M ${arrowX} ${upArrowY + LAYOUT_CONSTANTS.ARROW_SIZE} L ${arrowX + LAYOUT_CONSTANTS.ARROW_SIZE / 2} ${upArrowY} L ${arrowX + LAYOUT_CONSTANTS.ARROW_SIZE} ${upArrowY + LAYOUT_CONSTANTS.ARROW_SIZE} Z`

    // 下箭头（降序）- 指向下方的三角形
    const downArrowY = centerY + LAYOUT_CONSTANTS.ARROW_GAP / 2
    const downArrowPath = `M ${arrowX} ${downArrowY} L ${arrowX + LAYOUT_CONSTANTS.ARROW_SIZE / 2} ${downArrowY + LAYOUT_CONSTANTS.ARROW_SIZE} L ${arrowX + LAYOUT_CONSTANTS.ARROW_SIZE} ${downArrowY} Z`

    // 创建上箭头
    const upArrow = new Konva.Path({
      data: upArrowPath,
      fill: sortOrder === 'asc' ? props.sortActiveColor : COLORS.INACTIVE,
      name: 'sort-indicator-up'
    })

    upArrow.on('mouseenter', () => setPointerStyle(true, 'pointer'))
    upArrow.on('mouseleave', () => setPointerStyle(false, 'default'))
    upArrow.on('click', (evt) => {
      handleSortAction(columnOption, 'asc', false)
    })

    // 创建下箭头
    const downArrow = new Konva.Path({
      data: downArrowPath,
      fill: sortOrder === 'desc' ? props.sortActiveColor : COLORS.INACTIVE,
      name: 'sort-indicator-down'
    })

    downArrow.on('mouseenter', () => setPointerStyle(true, 'pointer'))
    downArrow.on('mouseleave', () => setPointerStyle(false, 'default'))
    downArrow.on('click', (evt) => {
      handleSortAction(columnOption, 'desc', false)
    })

    headerGroup.add(upArrow)
    headerGroup.add(downArrow)

    return { upArrow, downArrow }
  }

  /**
   * 创建列宽调整手柄 - 已注释掉
   */
  // const createColumnResizer = (
  //   columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
  //   headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  //   x: number,
  //   colIndex: number,
  //   headerGroup: Konva.Group
  // ) => {
  //   const resizer = new Konva.Rect({
  //     x: x + (columnOption.width || 0) - LAYOUT_CONSTANTS.RESIZER_WIDTH / 2,
  //     y: 0,
  //     width: LAYOUT_CONSTANTS.RESIZER_WIDTH,
  //     height: props.headerRowHeight,
  //     fill: 'transparent',
  //     listening: true,
  //     draggable: false,
  //     name: `col-resizer-${columnOption.columnName}`
  //   })

  //   // 添加鼠标交互
  //   resizer.on('mouseenter', () => setPointerStyle(true, 'col-resize'))
  //   resizer.on('mouseleave', () => {
  //     if (!tableVars.isResizingColumn) {
  //       setPointerStyle(false, 'default')
  //     }
  //   })

  //   headerGroup.add(resizer)

  //   resizer.on('mousedown', (evt) => {
  //     tableVars.isResizingColumn = true
  //     tableVars.resizingColumnName = columnOption.columnName
  //     tableVars.resizeStartX = evt.evt.clientX
  //     tableVars.resizeStartWidth = columnOption.width || 0

  //     // 设置邻近列信息（右侧列）
  //     const neighborColumn = headerCols[colIndex + 1]
  //     if (neighborColumn) {
  //       tableVars.resizeNeighborColumnName = neighborColumn.columnName
  //       tableVars.resizeNeighborStartWidth = neighborColumn.width || 0
  //     } else {
  //       tableVars.resizeNeighborColumnName = null
  //       tableVars.resizeNeighborStartWidth = 0
  //     }

  //     setPointerStyle(true, 'col-resize')
  //   })
  // }

  /**
   * 创建过滤图标
   * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} col 列
   * @param {number} x 列的x坐标
   * @param {number} y 列的y坐标
   * @param {number} width 列的宽度
   * @param {number} height 列的高度
   * @param {Konva.Group} headerGroup 表头组
   * @returns {Konva.Shape} 过滤图标
   */
  const createFilterIcon = (
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    x: number,
    y: number,
    width: number,
    height: number,
    headerGroup: Konva.Group
  ) => {
    // 检查列是否可过滤
    if (!col.filterable) {
      return
    }

    const hasFilter = !!(filterState[col.columnName] && filterState[col.columnName].size > 0)
    const filterColor = hasFilter ? props.sortActiveColor : COLORS.INACTIVE
    const filterX = x + width - LAYOUT_CONSTANTS.FILTER_ICON_OFFSET
    const centerY = y + height / 2
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

    headerGroup.add(filterIcon)
    return filterIcon
  }

  /**
   * 创建表头文本 - 添加排序支持
   * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption 列
   * @param {number} x 列的x坐标
   * @param {number} y 列的y坐标
   * @param {number} width 列的宽度
   * @param {number} height 列的高度
   * @param {Konva.Group} headerGroup 表头组
   * @returns {Konva.Text} 表头文本
   */
  const createHeaderCellText = (
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    x: number,
    y: number,
    width: number,
    height: number,
    headerGroup: Konva.Group
  ) => {
    const pools = tableVars.leftBodyPools
    const sortOrder = getColumnSortOrder(columnOption.columnName)
    const hasSort = sortOrder !== null

    // 如果有排序，给文本留出箭头空间
    const maxTextWidth = hasSort ? width - 32 : width - 16
    const text = truncateText(columnOption.columnName, maxTextWidth, props.headerFontSize, props.headerFontFamily)

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

    headerGroup.add(headerText)

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

    // 绘制简化的表头
    let x = 0
    for (let colIndex = 0; colIndex < headerCols.length; colIndex++) {
      const columnOption = headerCols[colIndex]
      const columnWidth = columnOption.width || 0

      if (columnWidth <= 0) {
        x += columnWidth
        continue
      }
      // 创建背景矩形
      createHeaderCellRect(
        columnOption,
        x,
        0,
        columnWidth,
        props.headerRowHeight,
        headerGroup,
        positionMapList,
        startColIndex,
        colIndex
      )

      // 创建文本
      createHeaderCellText(columnOption, x, 0, columnWidth, props.headerRowHeight, headerGroup)

      // 添加排序icon
      createSortIcon(columnOption, x, 0, columnWidth, props.headerRowHeight, headerGroup)

      // 添加过滤icon
      createFilterIcon(columnOption, x, 0, columnWidth, props.headerRowHeight, headerGroup)

      // 添加列宽调整手柄 - 已注释掉
      // createColumnResizer(columnOption, headerCols, x, colIndex, headerGroup)

      x += columnWidth
    }
  }

  return {
    drawHeaderPart
  }
}

//   /**
//    * 处理排序逻辑
//    */
//   const handleSortAction = (
//     columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
//     order: 'asc' | 'desc',
//     hasModifier: boolean
//   ) => {
//     const currentIndex = sortColumns.value.findIndex((s) => s.columnName === columnOption.columnName)

//     if (hasModifier) {
//       // 多列排序模式
//       handleMultiColumnSort(columnOption, order, currentIndex)
//     } else {
//       // 单列排序模式
//       handleSingleColumnSort(columnOption, order, currentIndex)
//     }

//     handleTableData(props.data)
//     clearGroups()
//     // 通过全局指针调用，避免 import 循环
//     tableVars.rebuildGroupsFn && tableVars.rebuildGroupsFn()
//   }

//   /**
//    * 多列排序处理
//    */
//   const handleMultiColumnSort = (
//     columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
//     order: 'asc' | 'desc',
//     currentIndex: number
//   ) => {
//     if (currentIndex === -1) {
//       // 添加新的排序列
//       sortColumns.value = [...sortColumns.value, { columnName: columnOption.columnName, order }]
//     } else {
//       const newSortColumns = [...sortColumns.value]
//       if (newSortColumns[currentIndex].order === order) {
//         // 移除该列的排序
//         newSortColumns.splice(currentIndex, 1)
//       } else {
//         // 切换排序方向
//         newSortColumns[currentIndex] = { columnName: columnOption.columnName, order }
//       }
//       sortColumns.value = newSortColumns
//     }
//   }

//   /**
//    * 单列排序处理
//    */
//   const handleSingleColumnSort = (
//     columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
//     order: 'asc' | 'desc',
//     currentIndex: number
//   ) => {
//     if (currentIndex === -1) {
//       // 设置新的排序
//       sortColumns.value = [{ columnName: columnOption.columnName, order }]
//     } else if (sortColumns.value[currentIndex].order === order) {
//       // 取消排序
//       sortColumns.value = []
//     } else {
//       // 切换排序方向
//       sortColumns.value = [{ columnName: columnOption.columnName, order }]
//     }
//   }

//   /**
//    * 创建排序箭头
//    */
//   const createSortArrows = (
//     columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
//     x: number,
//     centerY: number
//   ) => {
//     const foundSort = sortColumns.value.find((s) => s.columnName === columnOption.columnName)
//     const upColor = foundSort?.order === 'asc' ? props.sortActiveColor : COLORS.INACTIVE
//     const downColor = foundSort?.order === 'desc' ? props.sortActiveColor : COLORS.INACTIVE
//     const arrowX = x + (columnOption.width || 0) - LAYOUT_CONSTANTS.SORT_ARROW_OFFSET

//     const upTriangle = new Konva.RegularPolygon({
//       x: arrowX,
//       y: centerY - (LAYOUT_CONSTANTS.ARROW_SIZE + LAYOUT_CONSTANTS.ARROW_GAP) / 2,
//       sides: 3,
//       radius: LAYOUT_CONSTANTS.ARROW_SIZE,
//       rotation: 0,
//       fill: upColor,
//       listening: true
//     })

//     const downTriangle = new Konva.RegularPolygon({
//       x: arrowX,
//       y: centerY + (LAYOUT_CONSTANTS.ARROW_SIZE + LAYOUT_CONSTANTS.ARROW_GAP) / 2,
//       sides: 3,
//       radius: LAYOUT_CONSTANTS.ARROW_SIZE,
//       rotation: 180,
//       fill: downColor,
//       listening: true
//     })

//     // 添加鼠标交互
//     const setupArrowInteraction = (arrow: Konva.RegularPolygon, order: 'asc' | 'desc') => {
//       arrow.on('mouseenter', () => setPointerStyle(true, 'pointer'))
//       arrow.on('mouseleave', () => setPointerStyle(false, 'default'))
//       arrow.on('click', (evt) => {
//         if (tableVars.isResizingColumn) return
//         const hasModifier = !!(evt.evt && (evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey))
//         handleSortAction(columnOption, order, hasModifier)
//       })
//     }

//     setupArrowInteraction(upTriangle, 'asc')
//     setupArrowInteraction(downTriangle, 'desc')

//     return { upTriangle, downTriangle }
//   }

//   /**
//    * 创建过滤图标
//    */
//   const createFilterIcon = (
//     columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
//     x: number,
//     centerY: number
//   ) => {
//     const hasFilter = !!(filterState[columnOption.columnName] && filterState[columnOption.columnName].size > 0)
//     const filterColor = hasFilter ? props.sortActiveColor : COLORS.INACTIVE
//     const filterX = x + (columnOption.width || 0) - LAYOUT_CONSTANTS.FILTER_ICON_OFFSET
//     const iconSize = LAYOUT_CONSTANTS.FILTER_ICON_SIZE

//     const filterIcon = new Konva.Shape({
//       x: filterX - iconSize / 2,
//       y: centerY - iconSize / 2,
//       width: iconSize,
//       height: iconSize,
//       listening: true,
//       name: `filter-icon-${columnOption.columnName}`,
//       sceneFunc: (context, shape) => {
//         context.beginPath()
//         // 漏斗形状路径
//         context.moveTo(2, 2)
//         context.lineTo(14, 2)
//         context.lineTo(11, 7)
//         context.lineTo(11, 12)
//         context.lineTo(5, 12)
//         context.lineTo(5, 7)
//         context.closePath()
//         context.fillStrokeShape(shape)
//       },
//       stroke: filterColor,
//       strokeWidth: 1.5,
//       fill: hasFilter ? filterColor : 'transparent'
//     })

//     // 添加鼠标交互
//     filterIcon.on('mouseenter', () => setPointerStyle(true, 'pointer'))
//     filterIcon.on('mouseleave', () => setPointerStyle(false, 'default'))
//     filterIcon.on('click', (evt) => {
//       const uniqueValues = new Set<string>()
//       tableData.value.forEach((row) => uniqueValues.add(String(row[columnOption.columnName] ?? '')))

//       const availableOptions = Array.from(uniqueValues)
//       const currentSelection = filterState[columnOption.columnName] ? Array.from(filterState[columnOption.columnName]!) : []
//       const allOptions = Array.from(new Set([...availableOptions, ...currentSelection]))

//       openFilterDropdown(evt, columnOption.columnName, allOptions, currentSelection)
//     })

//     return filterIcon
//   }

//   /**
//    * 创建列宽调整手柄
//    */
//   const createColumnResizer = (
//     columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
//     headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
//     x: number,
//     colIndex: number
//   ) => {
//     const resizer = new Konva.Rect({
//       x: x + (columnOption.width || 0) - LAYOUT_CONSTANTS.RESIZER_WIDTH / 2,
//       y: 0,
//       width: LAYOUT_CONSTANTS.RESIZER_WIDTH,
//       height: props.headerRowHeight,
//       fill: 'transparent',
//       listening: true,
//       draggable: false,
//       name: `columnOption-resizer-${columnOption.columnName}`
//     })

//     // 添加鼠标交互
//     resizer.on('mouseenter', () => setPointerStyle(true, 'columnOption-resize'))
//     resizer.on('mouseleave', () => {
//       if (!tableVars.isResizingColumn) {
//         setPointerStyle(false, 'default')
//       }
//     })

//     resizer.on('mousedown', (evt) => {
//       tableVars.isResizingColumn = true
//       tableVars.resizingColumnName = columnOption.columnName
//       tableVars.resizeStartX = evt.evt.clientX
//       tableVars.resizeStartWidth = columnOption.width || 0

//       // 设置相邻列信息
//       const neighborColumn = headerCols[colIndex + 1]
//       if (neighborColumn) {
//         tableVars.resizeNeighborColumnName = neighborColumn.columnName
//         tableVars.resizeNeighborStartWidth = neighborColumn.width || 0
//       } else {
//         tableVars.resizeNeighborColumnName = null
//         tableVars.resizeNeighborStartWidth = 0
//       }

//       setPointerStyle(true, 'columnOption-resize')
//     })

//     return resizer
//   }

//   /**
//    * 绘制单个表头列
//    */
//   const drawSingleColumn = (
//     headerGroup: Konva.Group,
//     columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
//     headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
//     x: number,
//     colIndex: number,
//     startColIndex: number,
//     positionMapList: PositionMap[],
//     stageStartX: number
//   ) => {
//     // 创建表头单元格
//     const headerCell = createHeaderCell(columnOption, x, colIndex, startColIndex)
//     headerGroup.add(headerCell)

//     // 记录位置信息
//     positionMapList.push({
//       x: stageStartX + x,
//       y: 0,
//       width: columnOption.width || 0,
//       height: props.headerRowHeight,
//       rowIndex: 0,
//       colIndex: colIndex + startColIndex
//     })

//     // 创建表头文本
//     const headerText = createHeaderText(columnOption, x)
//     headerGroup.add(headerText)

//     const centerY = props.headerRowHeight / 2

//     // 添加排序功能
//     if (columnOption.sortable) {
//       const { upTriangle, downTriangle } = createSortArrows(columnOption, x, centerY)
//       headerGroup.add(upTriangle)
//       headerGroup.add(downTriangle)
//     }

//     // 添加过滤功能
//     if (columnOption.filterable) {
//       const filterIcon = createFilterIcon(columnOption, x, centerY)
//       headerGroup.add(filterIcon)
//     }

//     // 添加列宽调整功能
//     const resizer = createColumnResizer(columnOption, headerCols, x, colIndex)
//     headerGroup.add(resizer)
//   }

//   /**
//    * 绘制表头部分
//    */
//   const drawHeaderPart = (
//     headerGroup: Konva.Group | null,
//     headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
//     startColIndex: number,
//     positionMapList: PositionMap[],
//     stageStartX: number
//   ) => {
//     if (!headerGroup) return

//     let currentX = 0
//     headerCols.forEach((columnOption, colIndex) => {
//       drawSingleColumn(headerGroup, columnOption, headerCols, currentX, colIndex, startColIndex, positionMapList, stageStartX)
//       currentX += columnOption.width || 0
//     })
//   }

//   return {
//     drawHeaderPart
//   }
// }
