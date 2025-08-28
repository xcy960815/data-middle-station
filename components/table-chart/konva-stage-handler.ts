import Konva from 'konva'
import { clearPool, getTableContainerElement } from './utils'
import { tableVars } from './variable'

interface KonvaStageHandlerProps {
  props?: any
  getSummaryRowHeight?: () => number
  getScrollLimits?: () => { maxScrollX: number; maxScrollY: number }
  getSplitColumns?: () => {
    leftCols: any[]
    centerCols: any[]
    rightCols: any[]
    leftWidth: number
    centerWidth: number
    rightWidth: number
  }
  drawHeaderPart?: (
    headerGroup: Konva.Group | null,
    headerCols: any[],
    startColIndex: number,
    positionMapList: any[],
    stageStartX: number
  ) => void
  drawBodyPart?: (
    bodyGroup: Konva.Group | null,
    bodyCols: any[],
    pools: any,
    startColIndex: number,
    positionMapList: any[],
    stageStartX: number
  ) => void
  drawSummaryPart?: (
    summaryGroup: Konva.Group | null,
    summaryCols: any[],
    startColIndex: number,
    positionMapList: any[],
    stageStartX: number
  ) => void
  createScrollbars?: () => void
}

/**
 * Konva Stage 和 Layer 管理器
 */
export const konvaStageHandler = (deps?: KonvaStageHandlerProps) => {
  /**
   * 初始化 Stage 和所有 Layer
   * @returns {void}
   */
  const initStage = () => {
    const tableContainer = getTableContainerElement()
    if (!tableContainer) return

    const width = tableContainer.clientWidth
    const height = tableContainer.clientHeight

    if (!tableVars.stage) {
      tableVars.stage = new Konva.Stage({ container: tableContainer, width, height })
    } else {
      tableVars.stage.size({ width, height })
    }

    if (!tableVars.headerLayer) {
      tableVars.headerLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.headerLayer)
    }

    if (!tableVars.bodyLayer) {
      tableVars.bodyLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.bodyLayer)
    }

    if (!tableVars.fixedBodyLayer) {
      tableVars.fixedBodyLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.fixedBodyLayer)
    }

    if (!tableVars.fixedHeaderLayer) {
      tableVars.fixedHeaderLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.fixedHeaderLayer)
    }

    // 创建汇总图层与固定汇总图层（位于滚动条层之下）
    if (!tableVars.summaryLayer) {
      tableVars.summaryLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.summaryLayer)
    }

    if (!tableVars.fixedSummaryLayer) {
      tableVars.fixedSummaryLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.fixedSummaryLayer)
    }

    if (!tableVars.scrollbarLayer) {
      tableVars.scrollbarLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.scrollbarLayer)
    }

    tableVars.stage.setPointersPositions({
      clientX: 0,
      clientY: 0
    })
  }

  /**
   * 重建分组
   * @returns {void}
   */
  const rebuildGroups = () => {
    if (
      !deps ||
      !deps.props ||
      !deps.getSummaryRowHeight ||
      !deps.getScrollLimits ||
      !deps.getSplitColumns ||
      !deps.drawHeaderPart ||
      !deps.drawBodyPart ||
      !deps.drawSummaryPart ||
      !deps.createScrollbars
    ) {
      return
    }

    if (
      !tableVars.stage ||
      !tableVars.headerLayer ||
      !tableVars.bodyLayer ||
      !tableVars.fixedBodyLayer ||
      !tableVars.fixedHeaderLayer ||
      !tableVars.scrollbarLayer ||
      !tableVars.summaryLayer ||
      !tableVars.fixedSummaryLayer
    )
      return

    // 清空位置映射列表，准备重建
    tableVars.headerPositionMapList.length = 0
    tableVars.bodyPositionMapList.length = 0
    tableVars.summaryPositionMapList.length = 0

    const { leftCols, centerCols, rightCols, leftWidth, centerWidth, rightWidth } = deps.getSplitColumns()
    const stageWidth = tableVars.stage.width()
    const stageHeight = tableVars.stage.height()
    const { maxScrollX, maxScrollY } = deps.getScrollLimits()
    const verticalScrollbarSpace = maxScrollY > 0 ? deps.props.scrollbarSize : 0
    const horizontalScrollbarSpace = maxScrollX > 0 ? deps.props.scrollbarSize : 0

    if (!tableVars.centerBodyClipGroup) {
      const clipHeight = stageHeight - deps.props.headerHeight - deps.getSummaryRowHeight() - horizontalScrollbarSpace
      tableVars.centerBodyClipGroup = new Konva.Group({
        x: leftWidth,
        y: deps.props.headerHeight,
        clip: {
          x: 0,
          y: 0,
          width: stageWidth - leftWidth - rightWidth - verticalScrollbarSpace,
          height: clipHeight
        }
      })
      tableVars.bodyLayer.add(tableVars.centerBodyClipGroup)
    }

    tableVars.leftHeaderGroup = new Konva.Group({ x: 0, y: 0, name: 'left-header-group' })

    tableVars.centerHeaderGroup = new Konva.Group({
      x: leftWidth - tableVars.scrollX,
      y: 0,
      name: 'center-header-group'
    })

    tableVars.rightHeaderGroup = new Konva.Group({
      x: stageWidth - rightWidth - verticalScrollbarSpace,
      y: 0,
      name: 'right-header-group'
    })

    tableVars.leftBodyGroup = new Konva.Group({
      x: 0,
      y: deps.props.headerHeight - tableVars.stageScrollY,
      name: 'left-body-group'
    })

    tableVars.centerBodyGroup = new Konva.Group({
      x: -tableVars.scrollX,
      y: -tableVars.stageScrollY,
      name: 'center-body-group'
    })

    tableVars.rightBodyGroup = new Konva.Group({
      x: stageWidth - rightWidth - verticalScrollbarSpace,
      y: deps.props.headerHeight - tableVars.stageScrollY,
      name: 'right-body-group'
    })

    /**
     * 添加中心滚动表头到表头层（底层）
     */
    tableVars.headerLayer.add(tableVars.centerHeaderGroup)

    /**
     * 添加固定表头到固定表头层（顶层）
     */
    tableVars.fixedHeaderLayer.add(tableVars.leftHeaderGroup, tableVars.rightHeaderGroup)

    // 构建底部 summary 组（受开关控制）
    if (deps.props.enableSummary) {
      const summaryY = stageHeight - deps.getSummaryRowHeight() - horizontalScrollbarSpace
      tableVars.leftSummaryGroup = new Konva.Group({ x: 0, y: summaryY, name: 'left-summary-group' })

      tableVars.centerSummaryGroup = new Konva.Group({
        x: leftWidth - tableVars.scrollX,
        y: summaryY,
        name: 'center-summary-group'
      })

      tableVars.rightSummaryGroup = new Konva.Group({
        x: stageWidth - rightWidth - verticalScrollbarSpace,
        y: summaryY,
        name: 'right-summary-group'
      })
      // 中间 summary 放到底层，固定左右 summary 放顶层
      tableVars.summaryLayer.add(tableVars.centerSummaryGroup)
      tableVars.fixedSummaryLayer.add(tableVars.leftSummaryGroup, tableVars.rightSummaryGroup)
    } else {
      tableVars.leftSummaryGroup = null
      tableVars.centerSummaryGroup = null
      tableVars.rightSummaryGroup = null
    }

    /**
     * 添加中心滚动内容到剪辑组
     */
    tableVars.centerBodyClipGroup.add(tableVars.centerBodyGroup)

    /**
     * 添加固定列到固定层（顶层）
     */
    tableVars.fixedBodyLayer.add(tableVars.leftBodyGroup, tableVars.rightBodyGroup)

    tableVars.headerPositionMapList.length = 0
    /**
     * 绘制左侧表头部分
     */
    deps.drawHeaderPart(tableVars.leftHeaderGroup, leftCols, 0, tableVars.headerPositionMapList, 0)
    /**
     * 绘制中间表头部分
     */
    deps.drawHeaderPart(
      tableVars.centerHeaderGroup,
      centerCols,
      leftCols.length,
      tableVars.headerPositionMapList,
      leftWidth
    )
    /**
     * 绘制右侧表头部分
     */
    deps.drawHeaderPart(
      tableVars.rightHeaderGroup,
      rightCols,
      leftCols.length + centerCols.length,
      tableVars.headerPositionMapList,
      leftWidth + centerWidth
    )

    tableVars.bodyPositionMapList.length = 0
    /**
     * 绘制左侧主体部分
     */
    deps.drawBodyPart(tableVars.leftBodyGroup, leftCols, tableVars.leftBodyPools, 0, tableVars.bodyPositionMapList, 0)
    /**
     * 绘制中间主体部分
     */
    deps.drawBodyPart(
      tableVars.centerBodyGroup,
      centerCols,
      tableVars.centerBodyPools,
      leftCols.length,
      tableVars.bodyPositionMapList,
      leftWidth
    )
    /**
     * 绘制右侧主体部分
     */
    deps.drawBodyPart(
      tableVars.rightBodyGroup,
      rightCols,
      tableVars.rightBodyPools,
      leftCols.length + centerCols.length,
      tableVars.bodyPositionMapList,
      leftWidth + centerWidth
    )

    /**
     * 绘制底部 summary
     */
    if (deps.props.enableSummary) {
      tableVars.summaryPositionMapList.length = 0

      deps.drawSummaryPart(tableVars.leftSummaryGroup, leftCols, 0, tableVars.summaryPositionMapList, 0)
      deps.drawSummaryPart(
        tableVars.centerSummaryGroup,
        centerCols,
        leftCols.length,
        tableVars.summaryPositionMapList,
        leftWidth
      )
      deps.drawSummaryPart(
        tableVars.rightSummaryGroup,
        rightCols,
        leftCols.length + centerCols.length,
        tableVars.summaryPositionMapList,
        leftWidth + centerWidth
      )
    }

    deps.createScrollbars()

    tableVars.headerLayer.batchDraw()
    tableVars.bodyLayer?.batchDraw()
    tableVars.fixedBodyLayer?.batchDraw()
    tableVars.fixedHeaderLayer?.batchDraw()
    tableVars.summaryLayer?.batchDraw()
    tableVars.fixedSummaryLayer?.batchDraw()
    tableVars.scrollbarLayer?.batchDraw()
  }

  /**
   * 清除分组 清理所有分组
   * @returns {void}
   */
  const clearGroups = () => {
    tableVars.headerLayer?.destroyChildren()
    tableVars.bodyLayer?.destroyChildren()
    tableVars.summaryLayer?.destroyChildren()
    tableVars.fixedHeaderLayer?.destroyChildren()
    tableVars.fixedBodyLayer?.destroyChildren()
    tableVars.fixedSummaryLayer?.destroyChildren()
    tableVars.scrollbarLayer?.destroyChildren()
    clearPool(tableVars.leftBodyPools.cellRects)
    clearPool(tableVars.leftBodyPools.cellTexts)
    clearPool(tableVars.leftBodyPools.mergedCellRects)
    clearPool(tableVars.leftBodyPools.backgroundRects)
    clearPool(tableVars.centerBodyPools.cellRects)
    clearPool(tableVars.centerBodyPools.cellTexts)
    clearPool(tableVars.centerBodyPools.mergedCellRects)
    clearPool(tableVars.centerBodyPools.backgroundRects)
    clearPool(tableVars.rightBodyPools.cellRects)
    clearPool(tableVars.rightBodyPools.cellTexts)
    clearPool(tableVars.rightBodyPools.mergedCellRects)
    clearPool(tableVars.rightBodyPools.backgroundRects)

    /**
     * 重置滚动条引用
     */
    tableVars.verticalScrollbarGroup = null
    tableVars.horizontalScrollbarGroup = null
    tableVars.verticalScrollbarThumb = null
    tableVars.horizontalScrollbarThumb = null

    /**
     * 重置中心区域剪辑组引用
     */
    tableVars.centerBodyClipGroup = null

    /**
     * 重置单元格选择
     */
    tableVars.selectedCell = null
    tableVars.highlightRect = null

    /**
     * 重置虚拟滚动状态
     */
    tableVars.visibleRowStart = 0
    tableVars.visibleRowEnd = 0
    tableVars.visibleRowCount = 0

    /**
     * 重置汇总组引用
     */
    tableVars.leftSummaryGroup = null
    tableVars.centerSummaryGroup = null
    tableVars.rightSummaryGroup = null

    /**
     * 重置悬浮高亮
     */
    tableVars.hoveredRowIndex = null
    tableVars.hoveredColIndex = null
  }

  /**
   * 清理所有 Stage 相关资源
   */
  const destroyStage = () => {
    tableVars.stage?.destroy()
    tableVars.stage = null
    tableVars.headerLayer = null
    tableVars.bodyLayer = null
    tableVars.fixedBodyLayer = null
    tableVars.fixedHeaderLayer = null
    tableVars.summaryLayer = null
    tableVars.fixedSummaryLayer = null
    tableVars.scrollbarLayer = null
    tableVars.centerBodyClipGroup = null
    tableVars.selectedCell = null
    tableVars.highlightRect = null
  }

  return {
    initStage,
    rebuildGroups,
    clearGroups,
    destroyStage
  }
}
