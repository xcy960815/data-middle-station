import Konva from 'konva'
import { konvaStageHandler } from './konva-stage-handler'
import { constrainToRange } from './utils'
import { tableVars } from './variable'

interface TableLifecycleHandlerProps {
  props: any
  getSummaryRowHeight: () => number
  getScrollLimits: () => { maxScrollX: number; maxScrollY: number }
  getSplitColumns: () => {
    leftCols: any[]
    centerCols: any[]
    rightCols: any[]
    leftWidth: number
    centerWidth: number
    rightWidth: number
  }
  calculateVisibleRows: () => void
  // initStage: () => void
  drawHeaderPart: (
    headerGroup: Konva.Group | null,
    headerCols: any[],
    startColIndex: number,
    positionMapList: any[],
    stageStartX: number
  ) => void
  drawBodyPart: (
    bodyGroup: Konva.Group | null,
    bodyCols: any[],
    pools: any,
    startColIndex: number,
    positionMapList: any[],
    stageStartX: number
  ) => void
  drawSummaryPart: (
    summaryGroup: Konva.Group | null,
    summaryCols: any[],
    startColIndex: number,
    positionMapList: any[],
    stageStartX: number
  ) => void
  createScrollbars: () => void
}

/**
 * 表格生命周期处理器
 */
export const tableLifecycleHandler = ({
  props,
  getSummaryRowHeight,
  getScrollLimits,
  getSplitColumns,
  calculateVisibleRows,
  // initStage,
  drawHeaderPart,
  drawBodyPart,
  drawSummaryPart,
  createScrollbars
}: TableLifecycleHandlerProps) => {
  const { initStage, clearGroups, rebuildGroups } = konvaStageHandler()

  /**
   * 处理窗口大小改变
   * @returns {void}
   */
  const handleResize = () => {
    initStage()
    calculateVisibleRows()
    clearGroups()
    rebuildGroups()
  }

  /**
   * 从 props 初始化 初始化表格
   * @param {boolean} resetScroll 是否重置滚动状态
   * @returns {void}
   */
  const refreshTable = (resetScroll: boolean) => {
    /**
     * 重置滚动状态
     */
    if (resetScroll) {
      tableVars.scrollX = 0
      tableVars.stageScrollY = 0
    } else {
      /**
       * 在不重置时，保证滚动值在新范围内
       */
      const { maxScrollX, maxScrollY } = getScrollLimits()
      tableVars.scrollX = constrainToRange(tableVars.scrollX, 0, maxScrollX)
      tableVars.stageScrollY = constrainToRange(tableVars.stageScrollY, 0, maxScrollY)
    }

    calculateVisibleRows()
    clearGroups()
    rebuildGroups()
  }

  return {
    rebuildGroups,
    handleResize,
    refreshTable
  }
}
