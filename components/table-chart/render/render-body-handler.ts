import Konva from 'konva'
import { editorDropdownHandler } from '../dropdown/editor-dropdown-handler'
import { summaryDropDownHandler } from '../dropdown/summary-dropdown-handler'
import { konvaStageHandler } from '../konva-stage-handler'
import { chartProps } from '../props'
import { returnToPool, truncateText } from '../utils'
import { variableHandlder, type KonvaNodePools, type Prettify } from '../variable-handlder'
import { drawUnifiedRect, drawUnifiedText } from './draw'
interface RenderBodyHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}

export const renderBodyHandler = ({ props }: RenderBodyHandlerProps) => {
  // 注释过滤功能以提升性能
  // filterDropdownHandler 已迁移到组件中
  const { cellEditorDropdown, resetCellEditorDropdown, openCellEditorDropdown } = editorDropdownHandler({
    props
  })
  const { tableColumns, tableData, tableVars, summaryRowHeight } = variableHandlder({ props })
  const { getStageAttr } = konvaStageHandler({ props })
  const { summaryDropdown } = summaryDropDownHandler({ props })

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
    const columnsWithWidth = tableColumns.value.map((columnOption) => {
      const overrideWidth = tableVars.columnWidthOverrides[columnOption.columnName as string]
      const width =
        overrideWidth !== undefined
          ? overrideWidth
          : columnOption.width !== undefined
            ? columnOption.width
            : autoColumnWidth

      return { ...columnOption, width }
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
   * @returns {} 滚动限制
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
   * 计算单元格合并信息
   */
  const calculateCellSpan = (
    spanMethod: NonNullable<typeof props.spanMethod>,
    row: ChartDataVo.ChartData,
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    rowIndex: number,
    globalColIndex: number
  ) => {
    const res = spanMethod({ row, column: columnOption, rowIndex, colIndex: globalColIndex })
    let spanRow = 1
    let spanCol = 1

    if (Array.isArray(res)) {
      spanRow = Math.max(0, Number(res[0]) || 0)
      spanCol = Math.max(0, Number(res[1]) || 0)
    } else if (res && typeof res === 'object') {
      spanRow = Math.max(0, Number(res.rowspan) || 0)
      spanCol = Math.max(0, Number(res.colspan) || 0)
    }

    // 只要任一维度为 0，即视为被合并覆盖（与常见表格合并语义一致）
    const coveredBySpanMethod = spanRow === 0 || spanCol === 0

    return { spanRow, spanCol, coveredBySpanMethod }
  }

  /**
   * 计算合并单元格的总宽度
   */
  const calculateMergedCellWidth = (
    spanCol: number,
    colIndex: number,
    bodyCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    columnWidth: number
  ) => {
    if (spanCol <= 1) return columnWidth

    let totalWidth = 0
    for (let i = 0; i < spanCol && colIndex + i < bodyCols.length; i++) {
      const colInfo = bodyCols[colIndex + i]
      totalWidth += colInfo.width || 0
    }
    return totalWidth
  }

  /**
   * 获取单元格显示值
   */
  const getCellDisplayValue = (
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    row: ChartDataVo.ChartData,
    rowIndex: number
  ) => {
    const rawValue =
      columnOption.columnName === '__index__'
        ? String(rowIndex + 1)
        : row && typeof row === 'object'
          ? row[columnOption.columnName]
          : undefined
    return String(rawValue ?? '')
  }

  /**
   * 创建合并单元格
   */
  const drawMergedCell = (
    pools: KonvaNodePools,
    bodyGroup: Konva.Group,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    rowIndex: number,
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    row: ChartDataVo.ChartData,
    bodyFontSize: number
  ) => {
    // 绘制合并单元格背景
    const mergedCellRect = drawUnifiedRect({
      pools,
      name: 'merged-cell-rect',
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      fill: rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    bodyGroup.add(mergedCellRect)

    // 绘制合并单元格文本
    const value = getCellDisplayValue(columnOption, row, rowIndex)
    const maxTextWidth = cellWidth - 16
    const truncatedValue = truncateText(value, maxTextWidth, bodyFontSize, props.bodyFontFamily)

    const mergedCellText = drawUnifiedText({
      pools,
      name: 'merged-cell-text',
      text: truncatedValue,
      x,
      y,
      fontSize: bodyFontSize,
      fontFamily: props.bodyFontFamily,
      fill: props.bodyTextColor,
      align: columnOption.align || 'left',
      verticalAlign: 'middle',
      cellHeight,
      useGetTextX: true
    })
    bodyGroup.add(mergedCellText)
  }

  /**
   * 创建普通单元格
   */
  const drawNormalCell = (
    pools: KonvaNodePools,
    bodyGroup: Konva.Group,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    rowIndex: number,
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    row: ChartDataVo.ChartData,
    bodyFontSize: number
  ) => {
    // 绘制单元格背景
    const cellRect = drawUnifiedRect({
      pools,
      name: 'cell-rect',
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      fill: rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven,
      stroke: props.borderColor,
      strokeWidth: 1
    })

    // cellRect.off('click.cell')
    // cellRect.on('click.cell', handleClick)
    bodyGroup.add(cellRect)

    // 绘制单元格文本
    const value = getCellDisplayValue(columnOption, row, rowIndex)
    const maxTextWidth = cellWidth - 16
    const truncatedValue = truncateText(value, maxTextWidth, bodyFontSize, props.bodyFontFamily)

    const cellText = drawUnifiedText({
      pools,
      name: 'cell-text',
      text: truncatedValue,
      x,
      y,
      fontSize: bodyFontSize,
      fontFamily: props.bodyFontFamily,
      fill: props.bodyTextColor,
      align: columnOption.align || 'left',
      verticalAlign: 'middle',
      cellHeight,
      useGetTextX: true
    })
    bodyGroup.add(cellText)
  }

  /**
   * 渲染单个单元格
   */
  const renderCell = (params: {
    pools: KonvaNodePools
    bodyGroup: Konva.Group
    x: number
    y: number
    rowIndex: number
    colIndex: number
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption
    row: ChartDataVo.ChartData
    bodyCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>
    spanMethod: NonNullable<typeof props.spanMethod> | null
    hasSpanMethod: boolean
    globalIndexByColName: Map<string, number>
    bodyFontSize: number
  }) => {
    const {
      pools,
      bodyGroup,
      x,
      y,
      rowIndex,
      colIndex,
      columnOption,
      row,
      bodyCols,
      spanMethod,
      hasSpanMethod,
      globalIndexByColName,
      bodyFontSize
    } = params

    const columnWidth = columnOption.width || 0
    if (columnWidth <= 0) return { newX: x + columnWidth, skipCols: 0 }

    // 计算合并单元格信息
    let spanRow = 1
    let spanCol = 1
    let coveredBySpanMethod = false

    if (hasSpanMethod && spanMethod) {
      const globalColIndex = globalIndexByColName.get(columnOption.columnName as string) ?? colIndex
      const spanInfo = calculateCellSpan(spanMethod, row, columnOption, rowIndex, globalColIndex)
      spanRow = spanInfo.spanRow
      spanCol = spanInfo.spanCol
      coveredBySpanMethod = spanInfo.coveredBySpanMethod
    }

    // 如果被合并覆盖，跳过绘制
    if (hasSpanMethod && coveredBySpanMethod) {
      return { newX: x + columnWidth, skipCols: 0 }
    }

    const computedRowSpan = hasSpanMethod ? spanRow : 1
    const cellHeight = computedRowSpan * props.bodyRowHeight
    const cellWidth = calculateMergedCellWidth(spanCol, colIndex, bodyCols, columnWidth)
    // 绘制单元格
    if (hasSpanMethod && (computedRowSpan > 1 || spanCol > 1)) {
      drawMergedCell(pools, bodyGroup, x, y, cellWidth, cellHeight, rowIndex, columnOption, row, bodyFontSize)
    } else {
      drawNormalCell(pools, bodyGroup, x, y, cellWidth, cellHeight, rowIndex, columnOption, row, bodyFontSize)
    }

    // 计算下一个位置和跳过的列数
    const skipCols = hasSpanMethod && spanCol > 1 ? spanCol - 1 : 0
    const newX = hasSpanMethod && spanCol > 1 ? x + cellWidth : x + columnWidth

    return { newX, skipCols }
  }

  /**
   * 渲染单行的所有单元格
   */
  const renderRowCells = (params: {
    rowIndex: number
    y: number
    bodyCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>
    pools: KonvaNodePools
    bodyGroup: Konva.Group
    spanMethod: NonNullable<typeof props.spanMethod> | null
    hasSpanMethod: boolean
    globalIndexByColName: Map<string, number>
    bodyFontSize: number
  }) => {
    const { rowIndex, y, bodyCols, pools, bodyGroup, spanMethod, hasSpanMethod, globalIndexByColName, bodyFontSize } =
      params

    const row = tableData.value[rowIndex]
    let x = 0

    for (let colIndex = 0; colIndex < bodyCols.length; colIndex++) {
      const columnOption = bodyCols[colIndex]

      const result = renderCell({
        pools,
        bodyGroup,
        x,
        y,
        rowIndex,
        colIndex,
        columnOption,
        row,
        bodyCols,
        spanMethod,
        hasSpanMethod,
        globalIndexByColName,
        bodyFontSize
      })

      x = result.newX
      colIndex += result.skipCols
    }
  }

  /**
   * 画body区域 只渲染可视区域的行
   * @param {Konva.Group | null} group 分组
   * @param {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>} cols 列
   * @param {ObjectPools} pools 对象池
   * @returns {void}
   */
  const drawBodyPart = (
    bodyGroup: Konva.Group | null,
    bodyCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    pools: KonvaNodePools
  ) => {
    if (!tableVars.stage || !bodyGroup) return

    calculateVisibleRows()

    const bodyFontSize = props.bodyFontSize
    const spanMethod = typeof props.spanMethod === 'function' ? props.spanMethod : null
    const hasSpanMethod = !!spanMethod

    // 建立全局列索引映射
    const globalIndexByColName = new Map<string, number>()
    tableColumns.value.forEach((c, idx) => globalIndexByColName.set(c.columnName as string, idx))

    // 清理旧节点
    recoverKonvaNode(bodyGroup, pools)

    // 渲染可视区域的行
    for (let rowIndex = tableVars.visibleRowStart; rowIndex <= tableVars.visibleRowEnd; rowIndex++) {
      const y = rowIndex * props.bodyRowHeight
      renderRowCells({
        rowIndex,
        y,
        bodyCols,
        pools,
        bodyGroup,
        spanMethod,
        hasSpanMethod,
        globalIndexByColName,
        bodyFontSize
      })
    }

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
   * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption 列配置
   * @param {number} cellX 单元格 X 坐标
   * @param {number} cellY 单元格 Y 坐标
   * @param {number} cellWidth 单元格宽度
   * @param {number} cellHeight 单元格高度
   * @param {Konva.Group} group 分组
   */
  const handleCellClick = (
    rowIndex: number,
    columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
    cellX: number,
    cellY: number,
    cellWidth: number,
    cellHeight: number,
    group: Konva.Group
  ) => {
    createHighlightRect(cellX, cellY, cellWidth, cellHeight, group)
    tableData.value[rowIndex]
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

  return {
    calculateVisibleRows,
    getScrollLimits,
    getSplitColumns,
    drawBodyPart
  }
}
