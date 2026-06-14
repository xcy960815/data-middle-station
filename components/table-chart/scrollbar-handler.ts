import { bodyVars, calculateVisibleRows, columnsInfo, drawBodyPart } from './body-handler'
import { headerVars } from './header-handler'
import { getTableParams, getRuntimeState } from './parameter'
import { measureTablePerf, updateTablePerfSnapshot } from './perf'
import { scheduleLayersBatchDraw, stageVars } from './stage-handler'
import { summaryVars } from './summary-handler'
import type { ScrollState } from './runtime-state'

export const scrollbarVars = new Proxy({} as ScrollState, {
  get: (_target, property: keyof ScrollState) => getRuntimeState().scroll[property],
  set: (_target, property: keyof ScrollState, value) => {
    getRuntimeState().scroll[property] = value as never
    return true
  }
})

export const resetScrollState = () => {
  scrollbarVars.stageScrollY = 0
  scrollbarVars.stageScrollX = 0
}

/**
 * 更新水平滚动
 * @param {number} scrollLeft - 原生代理层的 scrollLeft
 * @returns {void}
 */
export const updateHorizontalScroll = (scrollLeft: number) => {
  if (!stageVars.stage || !headerVars.centerHeaderGroup || !bodyVars.centerBodyGroup) return
  measureTablePerf('horizontalScroll', () => {
    const centerHeaderGroup = headerVars.centerHeaderGroup
    const centerBodyGroup = bodyVars.centerBodyGroup
    if (!centerHeaderGroup || !centerBodyGroup) return

    scrollbarVars.stageScrollX = scrollLeft
    const headerX = columnsInfo.leftPartWidth - scrollbarVars.stageScrollX
    const centerX = -scrollbarVars.stageScrollX

    centerHeaderGroup.x(headerX)
    centerBodyGroup.x(centerX)
    if (summaryVars.centerSummaryGroup) {
      summaryVars.centerSummaryGroup.x(headerX)
    }

    scheduleLayersBatchDraw(['header', 'body', 'fixed', 'summary'])
    updateTablePerfSnapshot({
      scrollX: scrollbarVars.stageScrollX
    })
  })
}

/**
 * 滚动选项接口
 */
interface ScrollOptions {
  /** 是否跳过重渲染阈值检查 */
  skipThresholdCheck?: boolean
  /** 强制重渲染 */
  forceRerender?: boolean
}

/**
 * 更新垂直滚动
 * @param {number} scrollTop - 原生代理层的 scrollTop
 * @param {ScrollOptions} options - 滚动选项
 * @returns {void}
 */
export const updateVerticalScroll = (scrollTop: number, options: ScrollOptions = {}) => {
  if (!stageVars.stage || !bodyVars.leftBodyGroup || !bodyVars.centerBodyGroup || !bodyVars.rightBodyGroup) return
  measureTablePerf('verticalScroll', () => {
    const { skipThresholdCheck = false, forceRerender = false } = options

    const oldScrollY = scrollbarVars.stageScrollY
    const oldVisibleStart = bodyVars.visibleRowStart
    const oldVisibleEnd = bodyVars.visibleRowEnd

    scrollbarVars.stageScrollY = scrollTop

    calculateVisibleRows()

    const visibleRangeChanged = bodyVars.visibleRowStart !== oldVisibleStart || bodyVars.visibleRowEnd !== oldVisibleEnd
    const significantScroll =
      skipThresholdCheck || Math.abs(scrollbarVars.stageScrollY - oldScrollY) > getTableParams().bodyRowHeight * 5
    const needsRerender = forceRerender || visibleRangeChanged || significantScroll

    if (needsRerender) {
      const renderOperations = [
        () => drawBodyPart(bodyVars.leftBodyGroup!, columnsInfo.leftColumns, bodyVars.leftBodyPools),
        () => drawBodyPart(bodyVars.centerBodyGroup!, columnsInfo.centerColumns, bodyVars.centerBodyPools),
        () => drawBodyPart(bodyVars.rightBodyGroup!, columnsInfo.rightColumns, bodyVars.rightBodyPools)
      ]

      renderOperations.forEach((operation) => operation())

      if (bodyVars.highlightRect) {
        bodyVars.highlightRect.moveToTop()
      }
    }

    const fixedColumnsY = -scrollbarVars.stageScrollY
    const centerY = -scrollbarVars.stageScrollY

    bodyVars.leftBodyGroup?.y(fixedColumnsY)
    bodyVars.rightBodyGroup?.y(fixedColumnsY)
    bodyVars.centerBodyGroup?.y(centerY)

    scheduleLayersBatchDraw(['body', 'fixed', 'summary'])
    updateTablePerfSnapshot({
      visibleRows: Math.max(0, bodyVars.visibleRowEnd - bodyVars.visibleRowStart + 1),
      scrollY: scrollbarVars.stageScrollY
    })
  })
}
