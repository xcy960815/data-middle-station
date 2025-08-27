import Konva from 'konva'
import { chartProps } from './props'
import { returnToPool } from './utils'
import { tableVars, type KonvaNodePools, type Prettify } from './variable'

interface DrawBodyHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
  activeData: ComputedRef<Array<ChartDataVo.ChartData>>
  tableColumns: ComputedRef<Array<GroupStore.GroupOption | DimensionStore.DimensionOption>>
  getSummaryRowHeight: () => number
}

export const drawBodyHandler = ({ props, activeData, tableColumns, getSummaryRowHeight }: DrawBodyHandlerProps) => {
  /**
   * 计算可视区域 数据的起始行和结束行
   * @returns {void}
   */
  const calculateVisibleRows = () => {
    if (!tableVars.stage) return

    const stageHeight = tableVars.stage.height()
    const bodyHeight = stageHeight - props.headerHeight - getSummaryRowHeight() - props.scrollbarSize

    // 计算可视区域能显示的行数
    tableVars.visibleRowCount = Math.ceil(bodyHeight / props.bodyRowHeight)

    // 根据scrollY计算起始行
    const startRow = Math.floor(tableVars.stageScrollY / props.bodyRowHeight)

    // 算上缓冲条数的开始下标+结束下标
    tableVars.visibleRowStart = Math.max(0, startRow - props.bufferRows)
    tableVars.visibleRowEnd = Math.min(
      activeData.value.length - 1,
      startRow + tableVars.visibleRowCount + props.bufferRows
    )
  }
  /**
   * 在指定分组内创建单元格高亮矩形
   * @param x 矩形 X 坐标
   * @param y 矩形 Y 坐标
   * @param width 矩形宽度
   * @param height 矩形高度
   * @param group 分组
   */
  const createHighlightRect = (x: number, y: number, width: number, height: number, group: Konva.Group) => {
    if (tableVars.highlightRect) {
      tableVars.highlightRect.destroy()
      tableVars.highlightRect = null
    }

    tableVars.highlightRect = new Konva.Rect({
      x,
      y,
      width,
      height,
      fill: props.highlightCellBackground,
      listening: false
    })

    group.add(tableVars.highlightRect)

    tableVars.highlightRect.moveToTop()

    const layer = group.getLayer()
    layer?.batchDraw()
  }

  /**
   * 回收 Konva 节点
   * @param {Konva.Group} bodyGroup 分组
   * @param {ObjectPools} pools 对象池
   * @returns {void}
   */
  const recoverKonvaNode = (bodyGroup: Konva.Group, pools: KonvaNodePools) => {
    // 清空当前组，将对象返回池中
    const children = bodyGroup.children.slice()
    children.forEach((child) => {
      const isText = child instanceof Konva.Text
      const isRect = child instanceof Konva.Rect
      if (isText) {
        const isMergedCellText = child.name() === 'merged-cell-text'
        if (isMergedCellText) {
          returnToPool(pools.mergedCellTexts, child)
        }
        const isCellText = child.name() === 'cell-text'
        if (isCellText) {
          returnToPool(pools.cellTexts, child)
        }
      }
      if (isRect) {
        const isBackgroundRect = child.name() === 'background-rect'
        if (isBackgroundRect) {
          returnToPool(pools.backgroundRects, child)
        }
        const isMergedCellRect = child.name() === 'merged-cell-rect'
        if (isMergedCellRect) {
          returnToPool(pools.mergedCellRects, child)
        }

        const isCellRect = child.name() === 'cell-rect'
        if (isCellRect) {
          returnToPool(pools.cellRects, child)
        }
      }
    })
  }

  /**
   * 计算左右固定列与中间列的分组与宽度汇总
   * @returns
   */
  const getSplitColumns = () => {
    if (!tableVars.stage) {
      // 如果stage还没有初始化，返回默认值
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
    // 计算滚动条预留宽度
    const stageWidthRaw = tableVars.stage.width()
    // 计算滚动条预留高度
    const stageHeightRaw = tableVars.stage.height()
    // 计算内容高度
    const contentHeight = activeData.value.length * props.bodyRowHeight
    // 计算垂直滚动条预留空间
    const verticalScrollbarSpace =
      contentHeight > stageHeightRaw - props.headerHeight - getSummaryRowHeight() ? props.scrollbarSize : 0
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
   * @returns {{ maxScrollX: number, maxScrollY: number }}
   */
  const getScrollLimits = () => {
    if (!tableVars.stage) return { maxScrollX: 0, maxScrollY: 0 }
    const { totalWidth, leftWidth, rightWidth } = getSplitColumns()

    const stageWidth = tableVars.stage.width()
    const stageHeight = tableVars.stage.height()

    // 计算内容高度
    let contentHeight = activeData.value.length * props.bodyRowHeight

    // 初步估算：不预留滚动条空间
    const visibleContentWidthNoV = stageWidth - leftWidth - rightWidth
    const contentHeightNoH = stageHeight - props.headerHeight - getSummaryRowHeight()
    const prelimMaxX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidthNoV)
    const prelimMaxY = Math.max(0, contentHeight - contentHeightNoH)
    const verticalScrollbarSpace = prelimMaxY > 0 ? props.scrollbarSize : 0
    const horizontalScrollbarSpace = prelimMaxX > 0 ? props.scrollbarSize : 0
    // 复算：考虑另一条滚动条占位
    const visibleContentWidth = stageWidth - leftWidth - rightWidth - verticalScrollbarSpace
    const maxScrollX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidth)
    const maxScrollY = Math.max(
      0,
      contentHeight - (stageHeight - props.headerHeight - getSummaryRowHeight() - horizontalScrollbarSpace)
    )

    return { maxScrollX, maxScrollY }
  }

  return {
    createHighlightRect,
    calculateVisibleRows,
    recoverKonvaNode,
    getScrollLimits,
    getSplitColumns
  }
}
