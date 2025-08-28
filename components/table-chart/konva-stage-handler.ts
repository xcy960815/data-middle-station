import Konva from 'konva'
import { getTableContainerElement } from './utils'
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

  return {
    initStage,
    destroyStage,
    getStageAttr
  }
}
