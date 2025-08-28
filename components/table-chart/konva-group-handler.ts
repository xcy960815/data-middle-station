import Konva from 'konva'
import { clearPool } from './utils'
import { tableVars } from './variable'

export const konvaGroupHandler = () => {
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
