import Konva from 'konva'
import { editorDropdownHandler } from '../dropdown/editor-dropdown-handler'
import { summaryDropDownHandler } from '../dropdown/summary-dropdown-handler'
import type { CanvasTableEmits } from '../emits'
import { konvaStageHandler } from '../konva-stage-handler'
import { chartProps } from '../props'
import { getTableContainerElement, returnToPool, truncateText } from '../utils'
import { variableHandlder, type KonvaNodePools, type PositionMap, type Prettify } from '../variable-handlder'
import { drawUnifiedRect, drawUnifiedText } from './draw'
interface RenderBodyHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
  emits: <T extends keyof CanvasTableEmits>(event: T, ...args: CanvasTableEmits[T]) => void
}

export const renderBodyHandler = ({ props, emits }: RenderBodyHandlerProps) => {
  // 注释高亮功能以提升性能
  // const { updateHoverRects, invalidateHighlightCache } = highlightHandler({ props })
  // const { invalidateHighlightCache } = highlightHandler({ props })
  // 注释过滤功能以提升性能
  // const { filterDropdown } = filterDropdownHandler({ props })
  const { cellEditorDropdown, resetCellEditorDropdown, openCellEditorDropdown } = editorDropdownHandler({
    props,
    emits
  })
  const { tableColumns, tableData, tableVars } = variableHandlder({ props })
  const { getStageAttr, setPointerStyle } = konvaStageHandler({ props })
  const { summaryRowHeight, summaryDropdown } = summaryDropDownHandler({ props })

  /**
   * 计算可视区域 数据的起始行和结束行
   * @returns {void}
   */
  const calculateVisibleRows = () => {
    if (!tableVars.stage) return
    const stageHeight = tableVars.stage.height()
    const bodyHeight = stageHeight - props.headerRowHeight - summaryRowHeight.value - props.scrollbarSize

    // 计算可视区域能显示的行数
    tableVars.visibleRowCount = Math.ceil(bodyHeight / props.bodyRowHeight)

    // 根据scrollY计算起始行
    const startRow = Math.floor(tableVars.stageScrollY / props.bodyRowHeight)

    // 算上缓冲条数的开始下标+结束下标
    tableVars.visibleRowStart = Math.max(0, startRow - props.bufferRows)
    tableVars.visibleRowEnd = Math.min(
      tableData.value.length - 1,
      startRow + tableVars.visibleRowCount + props.bufferRows
    )
  }
  /**
   * 在指定分组内创建单元格高亮矩形
   * @param {number} x 矩形 X 坐标
   * @param {number} y 矩形 Y 坐标
   * @param {number} width 矩形 X 坐标
   * @param {number} height 矩形高度
   * @param {Konva.Group} bodyGroup 分组
   * @returns {void}
   */
  const createHighlightRect = (x: number, y: number, width: number, height: number, bodyGroup: Konva.Group) => {
    if (tableVars.highlightRect) {
      tableVars.highlightRect.destroy()
      tableVars.highlightRect = null
    }

    tableVars.highlightRect = new Konva.Rect({
      x,
      y,
      width,
      height,
      name: 'highlight-rect',
      fill: props.highlightCellBackground,
      listening: false
    })

    bodyGroup.add(tableVars.highlightRect)

    tableVars.highlightRect.moveToTop()

    const layer = bodyGroup.getLayer()

    layer?.batchDraw()
  }

  /**
   * 优化的节点回收 - 批量处理减少遍历次数
   * @param {Konva.Group} bodyGroup 分组
   * @param {ObjectPools} pools 对象池
   * @returns {void}
   */
  const recoverKonvaNode = (bodyGroup: Konva.Group, pools: KonvaNodePools) => {
    // 清空当前组，将对象返回池中
    const children = bodyGroup.children.slice()
    const textsToRecover: Konva.Text[] = []
    const rectsToRecover: Konva.Rect[] = []

    // 分类收集需要回收的节点
    children.forEach((child) => {
      if (child instanceof Konva.Text) {
        const name = child.name()
        // 处理合并单元格和普通单元格文本节点回收
        if (name === 'merged-cell-text' || name === 'cell-text') {
          textsToRecover.push(child)
        }
      } else if (child instanceof Konva.Rect) {
        const name = child.name()
        // 处理合并单元格和普通单元格矩形节点回收
        if (name === 'merged-cell-rect' || name === 'cell-rect') {
          rectsToRecover.push(child)
        }
      }
    })

    // 批量回收
    textsToRecover.forEach((text) => returnToPool(pools.cellTexts, text))
    rectsToRecover.forEach((rect) => returnToPool(pools.cellRects, rect))

    // 清空高亮缓存
    // invalidateHighlightCache()
  }

  /**
   * 计算左右固定列与中间列的分组与宽度汇总
   * @returns {Object} 分组与宽度汇总
   */
  const getSplitColumns = () => {
    if (!tableVars.stage) {
      const leftCols = tableColumns.value.filter((c) => c.fixed === 'left')
      const rightCols = tableColumns.value.filter((c) => c.fixed === 'right')
      const centerCols = tableColumns.value.filter((c) => !c.fixed)
      return {
        leftCols,
        centerCols,
        rightCols,
        leftWidth: 0,
        centerWidth: 0,
        rightWidth: 0,
        totalWidth: 0
      }
    }
    // 计算滚动条预留宽度 高度
    const { width: stageWidthRaw, height: stageHeightRaw } = getStageAttr()
    // 计算内容高度
    const contentHeight = tableData.value.length * props.bodyRowHeight
    // 计算垂直滚动条预留空间
    const verticalScrollbarSpace =
      contentHeight > stageHeightRaw - props.headerRowHeight - summaryRowHeight.value ? props.scrollbarSize : 0
    // 计算内容宽度
    const stageWidth = stageWidthRaw - verticalScrollbarSpace

    // 计算已设置宽度的列的总宽度
    const fixedWidthColumns = tableColumns.value.filter((c) => c.width !== undefined)
    const autoWidthColumns = tableColumns.value.filter((c) => c.width === undefined)
    const fixedTotalWidth = fixedWidthColumns.reduce((acc, c) => acc + (c.width || 0), 0)

    // 计算自动宽度列应该分配的宽度
    const remainingWidth = Math.max(0, stageWidth - fixedTotalWidth)
    const rawAutoWidth = autoWidthColumns.length > 0 ? remainingWidth / autoWidthColumns.length : 0
    const autoColumnWidth = Math.max(props.minAutoColWidth, rawAutoWidth)

    // 为每个列计算最终宽度（支持用户拖拽覆盖）
    const columnsWithWidth = tableColumns.value.map((col) => {
      const overrideWidth = tableVars.columnWidthOverrides[col.columnName as string]
      const width = overrideWidth !== undefined ? overrideWidth : col.width !== undefined ? col.width : autoColumnWidth

      return { ...col, width }
    })
    const leftCols = columnsWithWidth.filter((c) => c.fixed === 'left')
    const centerCols = columnsWithWidth.filter((c) => !c.fixed)
    const rightCols = columnsWithWidth.filter((c) => c.fixed === 'right')

    /**
     * 计算列宽总和
     * @param columns 列数组
     * @returns 列宽总和
     */
    const sumWidth = (columns: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>) =>
      columns.reduce((acc, column) => acc + (column.width || 0), 0)

    return {
      leftCols,
      centerCols,
      rightCols,
      leftWidth: sumWidth(leftCols),
      centerWidth: sumWidth(centerCols),
      rightWidth: sumWidth(rightCols),
      totalWidth: sumWidth(columnsWithWidth)
    }
  }
  /**
   * 获取滚动限制
   * @returns {Object} 滚动限制
   */
  const getScrollLimits = () => {
    if (!tableVars.stage) return { maxScrollX: 0, maxScrollY: 0 }
    const { totalWidth, leftWidth, rightWidth } = getSplitColumns()

    const { width: stageWidth, height: stageHeight } = getStageAttr()

    // 计算内容高度
    const contentHeight = tableData.value.length * props.bodyRowHeight

    // 初步估算：不预留滚动条空间
    const visibleContentWidthNoV = stageWidth - leftWidth - rightWidth
    const contentHeightNoH = stageHeight - props.headerRowHeight - summaryRowHeight.value
    const prelimMaxX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidthNoV)
    const prelimMaxY = Math.max(0, contentHeight - contentHeightNoH)
    const verticalScrollbarSpace = prelimMaxY > 0 ? props.scrollbarSize : 0
    const horizontalScrollbarSpace = prelimMaxX > 0 ? props.scrollbarSize : 0
    // 复算：考虑另一条滚动条占位
    const visibleContentWidth = stageWidth - leftWidth - rightWidth - verticalScrollbarSpace
    const maxScrollX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidth)
    const maxScrollY = Math.max(
      0,
      contentHeight - (stageHeight - props.headerRowHeight - summaryRowHeight.value - horizontalScrollbarSpace)
    )

    return { maxScrollX, maxScrollY }
  }

  /**
   * 判断坐标是否在表格区域内（排除滚动条区域）
   * @param clientX 客户端X坐标
   * @param clientY 客户端Y坐标
   * @returns {boolean} 是否在表格区域内
   */
  const isInTableArea = () => {
    if (!tableVars.stage) return false

    // 转换为 stage 坐标
    const pointerPosition = tableVars.stage.getPointerPosition()
    if (!pointerPosition) return false

    const { width: stageWidth, height: stageHeight } = getStageAttr()
    const { maxScrollX, maxScrollY } = getScrollLimits()

    // 计算表格有效区域（排除滚动条）
    const effectiveWidth = maxScrollY > 0 ? stageWidth - props.scrollbarSize : stageWidth
    const effectiveHeight = maxScrollX > 0 ? stageHeight - props.scrollbarSize : stageHeight

    return (
      pointerPosition.x >= 0 &&
      pointerPosition.x < effectiveWidth &&
      pointerPosition.y >= 0 &&
      pointerPosition.y < effectiveHeight
    )
  }

  /**
   *
   * 画body区域 只渲染可视区域的行
   * @param {Konva.Group | null} group 分组
   * @param {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>} cols 列
   * @param {ObjectPools} pools 对象池
   * @param {number} startColIndex 起始列索引
   * @param {PositionMap[]} positionMapList 位置映射列表
   * @param {number} stageStartX 舞台起始X坐标
   * @returns {void}
   */
  const drawBodyPart = (
    bodyGroup: Konva.Group | null,
    bodyCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    pools: KonvaNodePools,
    startColIndex: number,
    positionMapList: PositionMap[],
    stageStartX: number
  ) => {
    if (!tableVars.stage || !bodyGroup) return

    calculateVisibleRows()
    // 预计算：字体、span 方法、全局列索引映射、操作列按钮宽度
    const bodyFontFamily = props.bodyFontFamily
    const bodyFontSizeNumber =
      typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize
    // 恢复合并单元格相关代码
    const spanMethod = typeof props.spanMethod === 'function' ? props.spanMethod : null
    const hasSpanMethod = !!spanMethod

    const globalIndexByColName = new Map<string, number>()
    tableColumns.value.forEach((c, idx) => globalIndexByColName.set(c.columnName as string, idx))

    recoverKonvaNode(bodyGroup, pools)
    // 渲染可视区域的行
    for (let rowIndex = tableVars.visibleRowStart; rowIndex <= tableVars.visibleRowEnd; rowIndex++) {
      const row = tableData.value[rowIndex]
      // y坐标 - 使用绝对行位置，bodyGroup会通过y偏移处理滚动
      const y = rowIndex * props.bodyRowHeight
      // 渲染每列的单元格
      let x = 0
      for (let colIndex = 0; colIndex < bodyCols.length; colIndex++) {
        const col = bodyCols[colIndex]
        const columnWidth = col.width || 0
        // 跳过零宽列
        if (columnWidth <= 0) {
          x += columnWidth
          continue
        }
        // 恢复合并单元格逻辑
        let spanRow = 1
        let spanCol = 1
        let coveredBySpanMethod = false
        const globalColIndex = globalIndexByColName.get(col.columnName as string) ?? colIndex
        if (hasSpanMethod && spanMethod) {
          const res = spanMethod({ row, column: col, rowIndex, colIndex: globalColIndex })
          if (Array.isArray(res)) {
            spanRow = Math.max(0, Number(res[0]) || 0)
            spanCol = Math.max(0, Number(res[1]) || 0)
          } else if (res && typeof res === 'object') {
            spanRow = Math.max(0, Number(res.rowspan) || 0)
            spanCol = Math.max(0, Number(res.colspan) || 0)
          }
          // 只要任一维度为 0，即视为被合并覆盖（与常见表格合并语义一致）
          if (spanRow === 0 || spanCol === 0) coveredBySpanMethod = true
        }

        const shouldDraw = !hasSpanMethod || !coveredBySpanMethod

        if (!shouldDraw) {
          x += columnWidth
          continue
        }

        const computedRowSpan = hasSpanMethod ? spanRow : 1
        // const computedRowSpan = 1 // 禁用合并后总是1行

        const cellHeight = computedRowSpan * props.bodyRowHeight

        // 计算合并单元格的总宽度
        let cellWidth = columnWidth
        if (hasSpanMethod && spanCol > 1) {
          // 计算跨列的总宽度
          let totalWidth = 0
          for (let i = 0; i < spanCol && colIndex + i < bodyCols.length; i++) {
            const colInfo = bodyCols[colIndex + i]
            totalWidth += colInfo.width || 0
          }
          cellWidth = totalWidth
        }

        // 记录可视区域内主体单元格位置信息（使用舞台坐标）
        positionMapList.push({
          x: stageStartX + x,
          y: y + props.headerRowHeight,
          width: cellWidth,
          height: cellHeight,
          rowIndex: rowIndex + 1,
          colIndex: colIndex + startColIndex
        })
        // 合并单元格特殊处理逻辑
        if (hasSpanMethod && (computedRowSpan > 1 || spanCol > 1)) {
          // 合并单元格特殊绘制逻辑
          const mergedCellRect = drawUnifiedRect({
            pools,
            name: 'cell-rect',
            x,
            y,
            width: cellWidth,
            height: cellHeight,
            fill: rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven,
            stroke: props.borderColor,
            strokeWidth: 1,
            rowIndex: rowIndex + 1,
            colIndex: colIndex + startColIndex,
            originFill: rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven
          })
          bodyGroup.add(mergedCellRect)
          const rawValue =
            col.columnName === '__index__'
              ? String(rowIndex + 1)
              : row && typeof row === 'object'
                ? row[col.columnName]
                : undefined
          const value = String(rawValue ?? '')
          const maxTextWidth = cellWidth - 16
          const fontFamily = props.bodyFontFamily
          const fontSize = typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize
          const truncatedValue = truncateText(value, maxTextWidth, fontSize, fontFamily)

          const mergedCellText = drawUnifiedText({
            pools,
            name: 'merged-cell-text',
            text: truncatedValue,
            x,
            y,
            fontSize,
            fontFamily,
            fill: props.bodyTextColor,
            align: 'left',
            verticalAlign: 'middle',
            cellHeight,
            useGetTextX: true
          })
          bodyGroup.add(mergedCellText)
        } else {
          const cellRect = drawUnifiedRect({
            pools,
            name: 'cell-rect',
            x,
            y,
            width: cellWidth,
            height: cellHeight,
            fill: rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven,
            stroke: props.borderColor,
            strokeWidth: 1,
            rowIndex: rowIndex + 1,
            colIndex: colIndex + startColIndex,
            originFill: rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven
          })
          // 优化事件绑定 - 使用事件委托模式
          let clickTimeout: NodeJS.Timeout | null = null
          const handleClick = () => {
            if (clickTimeout) {
              clearTimeout(clickTimeout)
              clickTimeout = null
              return
            }
            clickTimeout = setTimeout(() => {
              handleCellClick(rowIndex, colIndex, col, cellRect.x(), cellRect.y(), cellWidth, cellHeight, bodyGroup)
              clickTimeout = null
            }, 250)
          }

          // 注释双击编辑功能以提升性能
          // const handleDoubleClick = () => {
          //   handleCellDoubleClick(
          //     rowIndex,
          //     colIndex + startColIndex,
          //     col,
          //     cellRect.x(),
          //     cellRect.y(),
          //     cellWidth,
          //     cellHeight
          //   )
          // }

          // 使用命名空间避免事件冲突，只保留点击事件
          cellRect.off('click.cell')
          // cellRect.off('dblclick.cell') // 注释双击事件
          cellRect.on('click.cell', handleClick)
          // cellRect.on('dblclick.cell', handleDoubleClick) // 注释双击事件

          bodyGroup.add(cellRect)
          // 创建文本
          const rawValue =
            col.columnName === '__index__'
              ? String(rowIndex + 1)
              : row && typeof row === 'object'
                ? row[col.columnName]
                : undefined
          const value = String(rawValue ?? '')
          const maxTextWidth = cellWidth - 16
          const fontFamily = bodyFontFamily
          const fontSize = bodyFontSizeNumber

          const truncatedValue = truncateText(value, maxTextWidth, fontSize, fontFamily)

          const cellText = drawUnifiedText({
            pools,
            name: 'cell-text',
            text: truncatedValue,
            x,
            y,
            fontSize,
            fontFamily,
            fill: props.bodyTextColor,
            align: 'left',
            verticalAlign: 'middle',
            cellHeight,
            useGetTextX: true
          })

          bodyGroup.add(cellText)

          // 注释tooltip功能以提升性能
          // const colShowOverflow = col.showOverflowTooltip
          // const enableTooltip = colShowOverflow !== undefined ? colShowOverflow : false
          // if (enableTooltip && truncatedValue !== value) {
          //   const handleMouseEnter = () => {
          //     if (!tableVars.stage) return
          //     tableVars.stage.container().setAttribute('title', String(rawValue ?? ''))
          //   }
          //
          //   const handleMouseLeave = () => {
          //     if (!tableVars.stage) return
          //     tableVars.stage.container().removeAttribute('title')
          //   }
          //
          //   cellRect.off('mouseenter.tooltip')
          //   cellRect.off('mouseleave.tooltip')
          //   cellRect.on('mouseenter.tooltip', handleMouseEnter)
          //   cellRect.on('mouseleave.tooltip', handleMouseLeave)
          // }
        }

        // 对于合并单元格，需要跳过被合并的列
        if (hasSpanMethod && spanCol > 1) {
          // 跳过被合并的列，x坐标已经通过cellWidth计算了正确位置
          x += cellWidth
          // 同时需要跳过循环中被合并的列
          colIndex += spanCol - 1
        } else {
          x += col.width || 0
        }
      }
    }
    // 注释高亮重计算以提升性能
    // recomputeHoverIndexFromPointer()

    // 渲染完成后，若存在点击高亮，保持其在最顶层
    if (tableVars.highlightRect) {
      tableVars.highlightRect.moveToTop()
      const layer = bodyGroup.getLayer()
      layer?.batchDraw()
    }
  }

  /**
   * 处理单元格点击，更新选中状态并抛出事件
   * @param {number} rowIndex 行索引
   * @param {number} colIndex 列索引
   * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} col 列配置
   * @param {number} cellX 单元格 X 坐标
   * @param {number} cellY 单元格 Y 坐标
   * @param {number} cellWidth 单元格宽度
   * @param {number} cellHeight 单元格高度
   * @param {Konva.Group} group 分组
   */
  const handleCellClick = (
    rowIndex: number,
    colIndex: number,
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    cellX: number,
    cellY: number,
    cellWidth: number,
    cellHeight: number,
    group: Konva.Group
  ) => {
    createHighlightRect(cellX, cellY, cellWidth, cellHeight, group)
    const rowData = tableData.value[rowIndex]
    emits('cell-click', { rowIndex, colIndex, colKey: col.columnName, rowData })
  }

  /**
   * 注释双击编辑功能以提升性能
   */
  // const handleCellDoubleClick = (
  //   rowIndex: number,
  //   colIndex: number,
  //   column: GroupStore.GroupOption | DimensionStore.DimensionOption,
  //   cellX: number,
  //   cellY: number,
  //   cellWidth: number,
  //   cellHeight: number
  // ) => {
  //   // 操作列不允许编辑
  //   if (column.columnName === 'action') return

  //   // 如果已经在编辑，先重置
  //   if (cellEditorDropdown.visible) {
  //     resetCellEditorDropdown()
  //     // 添加小延时确保重置完成
  //     setTimeout(() => {
  //       openCellEditorDropdown(rowIndex, colIndex, column, cellX, cellY, cellWidth, cellHeight)
  //     }, 10)
  //     return
  //   }

  //   openCellEditorDropdown(rowIndex, colIndex, column, cellX, cellY, cellWidth, cellHeight)
  // }

  /**
   * 判断当前指针位置的顶层元素是否属于表格容器
   * 若不属于，则认为表格被其它遮罩/弹层覆盖，此时不进行高亮
   * @param {number} clientX 鼠标点击位置的 X 坐标
   * @param {number} clientY 鼠标点击位置的 Y 坐标
   * @returns {boolean} 是否在表格容器内
   */
  const isTopMostInTable = (clientX: number, clientY: number): boolean => {
    const container = getTableContainerElement()
    if (!container) return false
    const topEl = document.elementFromPoint(clientX, clientY) as HTMLElement | null
    if (!topEl) return false
    if (!container.contains(topEl)) return false
    // 仅当命中的元素为 Konva 的 canvas（或其包裹层）时，认为没有被遮罩覆盖
    if (topEl.tagName === 'CANVAS') return true
    const konvaContent = topEl.closest('.konvajs-content') as HTMLElement | null
    if (konvaContent && container.contains(konvaContent)) return true
    // 命中的虽然在容器内，但不是 Konva 画布，视为被遮罩覆盖
    return false
  }

  /**
   * 注释高亮功能以提升性能 - 基于当前指针位置重新计算 行下标 列下标
   * @returns {void}
   */
  const recomputeHoverIndexFromPointer = () => {
    // 注释整个高亮计算逻辑以提升性能
    return

    // if (
    //   !tableVars.stage ||
    //   (!props.enableRowHoverHighlight && !props.enableColHoverHighlight) ||
    //   filterDropdown.visible ||
    //   summaryDropdown.visible
    // ) {
    //   return
    // }

    // // 清除高亮的辅助函数
    // const clearHoverHighlight = () => {
    //   if (tableVars.hoveredRowIndex !== null || tableVars.hoveredColIndex !== null) {
    //     tableVars.hoveredRowIndex = null
    //     tableVars.hoveredColIndex = null
    //     updateHoverRects()
    //   }
    // }

    // // 检查各种边界条件，如果不符合则清除高亮并返回
    // if (!isTopMostInTable(tableVars.lastClientX, tableVars.lastClientY)) {
    //   clearHoverHighlight()
    //   return
    // }

    // const pointerPosition = tableVars.stage.getPointerPosition()
    // if (!pointerPosition) {
    //   clearHoverHighlight()
    //   return
    // }

    // /**
    //  * 检查鼠标是否在表格区域内（排除滚动条区域）
    //  */
    // if (!isInTableArea()) {
    //   clearHoverHighlight()
    //   return
    // }

    // const localY = pointerPosition.y + tableVars.stageScrollY
    // const localX = pointerPosition.x + tableVars.stageScrollX
    // // 计算鼠标所在的行索引
    // const positionMapList = [
    //   ...tableVars.headerPositionMapList,
    //   ...tableVars.bodyPositionMapList,
    //   ...tableVars.summaryPositionMapList
    // ]
    // const positionOption = positionMapList.find(
    //   (item) => localX >= item.x && localX <= item.x + item.width && localY >= item.y && localY <= item.y + item.height
    // )
    // let newHoveredRowIndex = null
    // let newHoveredColIndex = null
    // if (positionOption) {
    //   newHoveredRowIndex = positionOption.rowIndex
    //   newHoveredColIndex = positionOption.colIndex
    // }
    // const rowChanged = newHoveredRowIndex !== tableVars.hoveredRowIndex
    // const colChanged = newHoveredColIndex !== tableVars.hoveredColIndex
    // if (rowChanged) {
    //   tableVars.hoveredRowIndex = newHoveredRowIndex
    // }
    // if (colChanged) {
    //   tableVars.hoveredColIndex = newHoveredColIndex
    // }

    // if (rowChanged || colChanged) {
    //   updateHoverRects()
    // }
  }

  return {
    recomputeHoverIndexFromPointer,
    calculateVisibleRows,
    getScrollLimits,
    getSplitColumns,
    drawBodyPart
  }
}
