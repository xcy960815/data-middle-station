import Konva from 'konva'
import { clearPool, getTableContainerElement } from './utils'
import { tableVars } from './variable'

/**
 * Konva Stage 和 Layer 管理器
 */
export const konvaStageHandler = () => {
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
    tableVars.highlightRect = null
  }

  /**
   * 获取 Stage 的属性
   * @returns {Object}
   */
  const getStageAttr = () => {
    if (!tableVars.stage) return { width: 0, height: 0 }
    return {
      width: tableVars.stage.width(),
      height: tableVars.stage.height()
    }
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
   * 创建左侧表头组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createHeaderLeftGroups = (x: number, y: number) => {
    const leftHeaderGroup = new Konva.Group({
      x: 0,
      y: 0,
      name: 'left-header-group'
    })
    return leftHeaderGroup
  }

  /**
   * 创建中间表头组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createHeaderCenterGroups = (x: number, y: number) => {
    const centerHeaderGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'center-header-group'
    })
    return centerHeaderGroup
  }

  /**
   * 创建右侧表头组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createHeaderRightGroups = (x: number, y: number) => {
    const rightHeaderGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'right-header-group'
    })
    return rightHeaderGroup
  }

  /**
   * 创建左侧表体组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createBodyLeftGroups = (x: number, y: number) => {
    const leftBodyGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'left-body-group'
    })
    return leftBodyGroup
  }

  /**
   * 创建中间表体组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createBodyCenterGroups = (x: number, y: number) => {
    const centerBodyGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'center-body-group'
    })
    return centerBodyGroup
  }

  /**
   * 创建右侧表体组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createBodyRightGroups = (x: number, y: number) => {
    const rightBodyGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'right-body-group'
    })
    return rightBodyGroup
  }

  /**
   * 创建左侧汇总组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createSummaryLeftGroups = (x: number, y: number) => {
    const leftSummaryGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'left-summary-group'
    })
    return leftSummaryGroup
  }

  /**
   * 创建中间汇总组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createSummaryCenterGroups = (x: number, y: number) => {
    const centerSummaryGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'center-summary-group'
    })
    return centerSummaryGroup
  }

  /**
   * 创建右侧汇总组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createSummaryRightGroups = (x: number, y: number) => {
    const rightSummaryGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'right-summary-group'
    })
    return rightSummaryGroup
  }

  /**
   * 创建中间表体剪辑组
   * @param x
   * @param y
   * @param clip
   * @returns {Konva.Group}
   */
  const createCenterBodyClipGroup = (
    x: number,
    y: number,
    clip: {
      x: number
      y: number
      width: number
      height: number
    }
  ) => {
    const centerBodyClipGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'center-body-clip-group',
      clip: clip
    })
    return centerBodyClipGroup
  }

  return {
    initStage,
    destroyStage,
    getStageAttr,
    createHeaderLeftGroups,
    createHeaderCenterGroups,
    createHeaderRightGroups,
    createBodyLeftGroups,
    createBodyCenterGroups,
    createBodyRightGroups,
    createSummaryLeftGroups,
    createSummaryCenterGroups,
    createSummaryRightGroups,
    createCenterBodyClipGroup,
    clearGroups
  }
}
