import Konva from 'konva'
import type { CanvasTableEmits } from './emits'
import { chartProps } from './props'
import { renderBodyHandler } from './render/render-body-handler'
import { renderHeaderHandler } from './render/render-header-handler'
import { renderScrollbarsHandler } from './render/render-scrollbars-handler'
import { renderSummaryHandler } from './render/render-summary-handler'
import { clearPool, constrainToRange, getTableContainerElement } from './utils'
import { variableHandlder, type Prettify } from './variable-handlder'
interface KonvaStageHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
  emits?: <T extends keyof CanvasTableEmits>(event: T, ...args: CanvasTableEmits[T]) => void
}
/**
 * Konva Stage 和 Layer 管理器
 */
export const konvaStageHandler = ({ props, emits }: KonvaStageHandlerProps) => {
  const { tableVars } = variableHandlder({ props })
  const summaryRowHeight = computed(() => (props.enableSummary ? props.summaryHeight : 0))
  const ensureEmits = () => {
    if (!emits) {
      throw new Error('This operation requires emits to be provided to konvaStageHandler')
    }
    return emits
  }
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

    // 修复Layer层级顺序：确保表头在最上层不被遮挡

    // 1. 主体内容层（最底层 - 可滚动的body部分）
    if (!tableVars.bodyLayer) {
      tableVars.bodyLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.bodyLayer)
    }

    // 2. 固定列body层（中间层 - 左右固定列的body部分）
    if (!tableVars.fixedBodyLayer) {
      tableVars.fixedBodyLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.fixedBodyLayer)
    }

    // 3. 表头层（高层 - 所有表头，不被遮挡）
    if (!tableVars.headerLayer) {
      tableVars.headerLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.headerLayer)
    }

    // 4. 滚动条层（最高层）
    if (!tableVars.scrollbarLayer) {
      tableVars.scrollbarLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.scrollbarLayer)
    }

    // 5. 汇总层（像header一样，统一管理）
    if (!tableVars.summaryLayer) {
      tableVars.summaryLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.summaryLayer)
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
    // 修复后有4个真实的Layer
    tableVars.headerLayer = null
    tableVars.bodyLayer = null
    tableVars.fixedBodyLayer = null
    tableVars.scrollbarLayer = null
    // 这些只是引用，设为null即可
    tableVars.summaryLayer = null
    tableVars.centerBodyClipGroup = null
    tableVars.highlightRect = null
  }

  /**
   * 设置指针样式的辅助函数
   * @param on 是否显示指针
   */
  const setPointerStyle = (on: boolean, cursor: string) => {
    if (tableVars.stage) tableVars.stage.container().style.cursor = on ? cursor : 'default'
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
   * 刷新表格（可选重置滚动位置）
   * @param resetScroll 是否重置滚动位置
   */
  const refreshTable = (resetScroll: boolean) => {
    const { getScrollLimits, calculateVisibleRows } = renderBodyHandler({ props, emits: ensureEmits() })

    if (resetScroll) {
      tableVars.stageScrollX = 0
      tableVars.stageScrollY = 0
    } else {
      const { maxScrollX, maxScrollY } = getScrollLimits()
      tableVars.stageScrollX = constrainToRange(tableVars.stageScrollX, 0, maxScrollX)
      tableVars.stageScrollY = constrainToRange(tableVars.stageScrollY, 0, maxScrollY)
    }

    calculateVisibleRows()
    clearGroups()
    rebuildGroups()
  }

  /**
   * 全局鼠标移动处理
   */
  const handleGlobalMouseMove = (mouseEvent: MouseEvent) => {
    if (!tableVars.stage) return
    tableVars.stage.setPointersPositions(mouseEvent)

    // 记录鼠标在屏幕中的坐标
    tableVars.lastClientX = mouseEvent.clientX
    tableVars.lastClientY = mouseEvent.clientY

    const { drawBodyPart, recomputeHoverIndexFromPointer, calculateVisibleRows, getScrollLimits, getSplitColumns } =
      renderBodyHandler({ props, emits: ensureEmits() })
    const { updateScrollPositions } = renderScrollbarsHandler({ props, emits: ensureEmits() })
    const { tableData } = variableHandlder({ props })

    // 列宽拖拽中：实时更新覆盖宽度并重建分组
    if (tableVars.isResizingColumn && tableVars.resizingColumnName) {
      const delta = mouseEvent.clientX - tableVars.resizeStartX
      const newWidth = Math.max(props.minAutoColWidth, tableVars.resizeStartWidth + delta)
      tableVars.columnWidthOverrides[tableVars.resizingColumnName] = newWidth
      if (tableVars.resizeNeighborColumnName) {
        const neighborWidth = Math.max(props.minAutoColWidth, tableVars.resizeNeighborStartWidth - delta)
        tableVars.columnWidthOverrides[tableVars.resizeNeighborColumnName] = neighborWidth
      }
      clearGroups()
      rebuildGroups()
      return
    }

    // 手动拖拽导致的垂直滚动
    if (tableVars.isDraggingVerticalThumb) {
      const deltaY = mouseEvent.clientY - tableVars.dragStartY
      const scrollThreshold = props.scrollThreshold
      if (Math.abs(deltaY) < scrollThreshold) return

      const { maxScrollY, maxScrollX } = getScrollLimits()
      const stageHeight = tableVars.stage.height()
      const trackHeight =
        stageHeight -
        props.headerHeight -
        // (props.enableSummary ? props.summaryHeight : 0) - // 注释汇总高度
        0 - // 禁用汇总行
        (maxScrollX > 0 ? props.scrollbarSize : 0)
      const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.bodyRowHeight))
      const scrollRatio = deltaY / (trackHeight - thumbHeight)
      const newScrollY = tableVars.dragStartScrollY + scrollRatio * maxScrollY

      const oldScrollY = tableVars.stageScrollY
      tableVars.stageScrollY = constrainToRange(newScrollY, 0, maxScrollY)

      // 检查是否需要重新渲染虚拟滚动内容
      const oldVisibleStart = tableVars.visibleRowStart
      const oldVisibleEnd = tableVars.visibleRowEnd
      calculateVisibleRows()

      const needsRerender =
        tableVars.visibleRowStart !== oldVisibleStart ||
        tableVars.visibleRowEnd !== oldVisibleEnd ||
        Math.abs(tableVars.stageScrollY - oldScrollY) > props.bodyRowHeight * 5 // 配合更大的缓冲行数，减少重新渲染频率

      if (needsRerender) {
        const { leftCols, centerCols, rightCols, leftWidth, centerWidth } = getSplitColumns()
        tableVars.bodyPositionMapList.length = 0
        drawBodyPart(tableVars.leftBodyGroup, leftCols, tableVars.leftBodyPools, 0, tableVars.bodyPositionMapList, 0)
        drawBodyPart(
          tableVars.centerBodyGroup,
          centerCols,
          tableVars.centerBodyPools,
          leftCols.length,
          tableVars.bodyPositionMapList,
          leftWidth
        )
        drawBodyPart(
          tableVars.rightBodyGroup,
          rightCols,
          tableVars.rightBodyPools,
          leftCols.length + centerCols.length,
          tableVars.bodyPositionMapList,
          leftWidth + centerWidth
        )
      }

      updateScrollPositions()
      return
    }

    // 手动拖拽导致的水平滚动
    if (tableVars.isDraggingHorizontalThumb) {
      const deltaX = mouseEvent.clientX - tableVars.dragStartX
      const scrollThreshold = props.scrollThreshold
      if (Math.abs(deltaX) < scrollThreshold) return

      const { maxScrollX } = getScrollLimits()
      const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
      const stageWidth = tableVars.stage.width()
      const visibleWidth = stageWidth - leftWidth - rightWidth - props.scrollbarSize
      const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
      const scrollRatio = deltaX / (visibleWidth - thumbWidth)
      const newScrollX = tableVars.dragStartScrollX + scrollRatio * maxScrollX

      tableVars.stageScrollX = constrainToRange(newScrollX, 0, maxScrollX)
      updateScrollPositions()
      return
    }
    // 注释高亮重计算以提升性能
    // recomputeHoverIndexFromPointer()
  }

  /**
   * 全局鼠标抬起处理
   */
  const handleGlobalMouseUp = (mouseEvent: MouseEvent) => {
    if (tableVars.stage) tableVars.stage.setPointersPositions(mouseEvent)

    // 滚动条拖拽结束
    if (tableVars.isDraggingVerticalThumb || tableVars.isDraggingHorizontalThumb) {
      tableVars.isDraggingVerticalThumb = false
      tableVars.isDraggingHorizontalThumb = false
      setPointerStyle(false, 'default')
      if (tableVars.verticalScrollbarThumbRect && !tableVars.isDraggingVerticalThumb)
        tableVars.verticalScrollbarThumbRect.fill(props.scrollbarThumb)
      if (tableVars.horizontalScrollbarThumbRect && !tableVars.isDraggingHorizontalThumb)
        tableVars.horizontalScrollbarThumbRect.fill(props.scrollbarThumb)
      tableVars.scrollbarLayer?.batchDraw()
    }

    // 列宽拖拽结束
    if (tableVars.isResizingColumn) {
      tableVars.isResizingColumn = false
      tableVars.resizingColumnName = null
      tableVars.resizeNeighborColumnName = null
      setPointerStyle(false, 'default')
      clearGroups()
      rebuildGroups()
    }
  }

  /**
   * 全局窗口尺寸变化处理
   */
  const handleGlobalResize = () => {
    initStage()
    const { calculateVisibleRows } = renderBodyHandler({ props, emits: ensureEmits() })
    calculateVisibleRows()
    clearGroups()
    rebuildGroups()
  }

  /**
   * 清除分组 清理所有分组
   * @returns {void}
   */
  const clearGroups = () => {
    // 清理4个真实的Layer
    tableVars.headerLayer?.destroyChildren()
    tableVars.bodyLayer?.destroyChildren()
    tableVars.fixedBodyLayer?.destroyChildren()
    tableVars.scrollbarLayer?.destroyChildren()
    clearPool(tableVars.leftBodyPools.cellRects)
    clearPool(tableVars.leftBodyPools.cellTexts)
    clearPool(tableVars.centerBodyPools.cellRects)
    clearPool(tableVars.centerBodyPools.cellTexts)
    clearPool(tableVars.rightBodyPools.cellRects)
    clearPool(tableVars.rightBodyPools.cellTexts)

    /**
     * 重置滚动条引用
     */
    tableVars.verticalScrollbarGroup = null
    tableVars.horizontalScrollbarGroup = null
    tableVars.verticalScrollbarThumbRect = null
    tableVars.horizontalScrollbarThumbRect = null

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
   * 重建分组
   * @returns {void}
   */
  const rebuildGroups = () => {
    if (
      !tableVars.stage ||
      !tableVars.headerLayer ||
      !tableVars.bodyLayer ||
      !tableVars.fixedBodyLayer ||
      !tableVars.summaryLayer ||
      !tableVars.scrollbarLayer
    ) {
      return
    }

    // 必须提供 emits 才能完整重建（用于下拉与交互）
    if (!emits) {
      throw new Error('rebuildGroups requires emits to be provided to konvaStageHandler')
    }

    const { drawHeaderPart } = renderHeaderHandler({ props })
    const { drawBodyPart, getSplitColumns, getScrollLimits } = renderBodyHandler({ props, emits })
    const { drawSummaryPart } = renderSummaryHandler({ props })
    const { createScrollbars } = renderScrollbarsHandler({ props, emits })

    const { leftCols, centerCols, rightCols, leftWidth, centerWidth, rightWidth } = getSplitColumns()
    const { width: stageWidth, height: stageHeight } = getStageAttr()
    const { maxScrollX, maxScrollY } = getScrollLimits()
    const verticalScrollbarWidth = maxScrollY > 0 ? props.scrollbarSize : 0
    const horizontalScrollbarHeight = maxScrollX > 0 ? props.scrollbarSize : 0

    // 为中间可滚动区域创建裁剪组，防止遮挡固定列
    if (!tableVars.centerBodyClipGroup) {
      const clipHeight = stageHeight - props.headerHeight - summaryRowHeight.value - horizontalScrollbarHeight
      tableVars.centerBodyClipGroup = createCenterBodyClipGroup(leftWidth, props.headerHeight, {
        x: 0,
        y: 0,
        width: stageWidth - leftWidth - rightWidth - verticalScrollbarWidth,
        height: clipHeight
      })
      tableVars.bodyLayer.add(tableVars.centerBodyClipGroup)
    }

    // 为中间表头也创建裁剪组，防止表头横向滚动时遮挡固定列
    const centerHeaderClipGroup = new Konva.Group({
      x: 0,
      y: 0,
      name: 'center-header-clip-group',
      clip: {
        x: 0,
        y: 0,
        width: stageWidth - rightWidth - verticalScrollbarWidth,
        height: props.headerHeight
      }
    })

    tableVars.headerLayer.add(centerHeaderClipGroup)

    // 方式1：单独创建（保持原有方式）
    tableVars.leftHeaderGroup = createHeaderLeftGroups(0, 0)
    tableVars.centerHeaderGroup = createHeaderCenterGroups(leftWidth, 0)
    tableVars.rightHeaderGroup = createHeaderRightGroups(stageWidth - rightWidth - verticalScrollbarWidth, 0)

    tableVars.leftBodyGroup = createBodyLeftGroups(0, 0) // 现在相对于裁剪组，初始位置为0
    tableVars.centerBodyGroup = createBodyCenterGroups(-tableVars.stageScrollX, -tableVars.stageScrollY)
    tableVars.rightBodyGroup = createBodyRightGroups(0, 0) // 现在相对于裁剪组，初始位置为0

    // 修复表头Group分配：使用裁剪组防止遮挡
    centerHeaderClipGroup.add(tableVars.centerHeaderGroup) // 中间表头放入裁剪组
    tableVars.headerLayer.add(tableVars.leftHeaderGroup, tableVars.rightHeaderGroup) // 固定表头必须在表头层，确保不被body层遮挡

    // 创建汇总行组（像header一样统一管理）
    if (props.enableSummary) {
      const summaryY = stageHeight - summaryRowHeight.value - horizontalScrollbarHeight

      // 为中间汇总也创建裁剪组，防止汇总横向滚动时遮挡固定列
      const centerSummaryClipGroup = new Konva.Group({
        x: 0,
        y: summaryY,
        name: 'center-summary-clip-group',
        clip: {
          x: 0,
          y: 0,
          width: stageWidth - rightWidth - verticalScrollbarWidth,
          height: summaryRowHeight.value
        }
      })
      tableVars.summaryLayer.add(centerSummaryClipGroup)

      tableVars.leftSummaryGroup = createSummaryLeftGroups(0, summaryY)
      tableVars.centerSummaryGroup = createSummaryCenterGroups(-tableVars.stageScrollX, 0) // 相对于裁剪组的位置
      tableVars.rightSummaryGroup = createSummaryRightGroups(stageWidth - rightWidth - verticalScrollbarWidth, summaryY)

      // 像header一样：中间汇总放入裁剪组，固定汇总直接加到汇总层
      centerSummaryClipGroup.add(tableVars.centerSummaryGroup)
      tableVars.summaryLayer.add(tableVars.leftSummaryGroup, tableVars.rightSummaryGroup)
    } else {
      tableVars.leftSummaryGroup = null
      tableVars.centerSummaryGroup = null
      tableVars.rightSummaryGroup = null
    }

    tableVars.centerBodyClipGroup.add(tableVars.centerBodyGroup)

    // 为左侧和右侧固定列body组也创建裁剪组，防止延伸到滚动条区域
    const leftBodyClipGroup = new Konva.Group({
      x: 0,
      y: props.headerHeight,
      name: 'left-body-clip-group',
      clip: {
        x: 0,
        y: 0,
        width: leftWidth,
        height: stageHeight - props.headerHeight - summaryRowHeight.value - horizontalScrollbarHeight
      }
    })

    const rightBodyClipGroup = new Konva.Group({
      x: stageWidth - rightWidth - verticalScrollbarWidth,
      y: props.headerHeight,
      name: 'right-body-clip-group',
      clip: {
        x: 0,
        y: 0,
        width: rightWidth,
        height: stageHeight - props.headerHeight - summaryRowHeight.value - horizontalScrollbarHeight
      }
    })

    // 将左右body组放入各自的裁剪组中，并调整组的位置为相对于裁剪组
    leftBodyClipGroup.add(tableVars.leftBodyGroup)
    rightBodyClipGroup.add(tableVars.rightBodyGroup)

    // 调整左右body组的位置，使其相对于裁剪组
    tableVars.leftBodyGroup.x(0)
    tableVars.leftBodyGroup.y(-tableVars.stageScrollY)
    tableVars.rightBodyGroup.x(0)
    tableVars.rightBodyGroup.y(-tableVars.stageScrollY)

    tableVars.fixedBodyLayer.add(leftBodyClipGroup, rightBodyClipGroup) // 添加裁剪组到固定层

    tableVars.headerPositionMapList.length = 0
    // 绘制表头
    drawHeaderPart(tableVars.leftHeaderGroup, leftCols, 0, tableVars.headerPositionMapList, 0)
    drawHeaderPart(tableVars.centerHeaderGroup, centerCols, leftCols.length, tableVars.headerPositionMapList, leftWidth)
    drawHeaderPart(
      tableVars.rightHeaderGroup,
      rightCols,
      leftCols.length + centerCols.length,
      tableVars.headerPositionMapList,
      leftWidth + centerWidth
    )

    tableVars.bodyPositionMapList.length = 0
    // 绘制主体
    drawBodyPart(tableVars.leftBodyGroup, leftCols, tableVars.leftBodyPools, 0, tableVars.bodyPositionMapList, 0)
    drawBodyPart(
      tableVars.centerBodyGroup,
      centerCols,
      tableVars.centerBodyPools,
      leftCols.length,
      tableVars.bodyPositionMapList,
      leftWidth
    )
    drawBodyPart(
      tableVars.rightBodyGroup,
      rightCols,
      tableVars.rightBodyPools,
      leftCols.length + centerCols.length,
      tableVars.bodyPositionMapList,
      leftWidth + centerWidth
    )

    // 绘制汇总行
    if (props.enableSummary) {
      tableVars.summaryPositionMapList.length = 0
      drawSummaryPart(tableVars.leftSummaryGroup, leftCols, 0, tableVars.summaryPositionMapList, 0)
      drawSummaryPart(
        tableVars.centerSummaryGroup,
        centerCols,
        leftCols.length,
        tableVars.summaryPositionMapList,
        leftWidth
      )
      drawSummaryPart(
        tableVars.rightSummaryGroup,
        rightCols,
        leftCols.length + centerCols.length,
        tableVars.summaryPositionMapList,
        leftWidth + centerWidth
      )
    }

    createScrollbars()

    // 确保层级绘制顺序正确：固定列在上层
    tableVars.bodyLayer?.batchDraw() // 1. 先绘制可滚动的中间内容
    tableVars.fixedBodyLayer?.batchDraw() // 2. 再绘制固定列（覆盖在上面）
    tableVars.headerLayer.batchDraw() // 3. 表头在最上层
    tableVars.summaryLayer?.batchDraw() // 4. 汇总层（像header一样统一管理）
    tableVars.scrollbarLayer?.batchDraw() // 5. 滚动条在最顶层
  }

  // 暴露到全局状态，供其他模块调用（仅在提供 emits 时设置，以避免无 emits 实例覆盖）
  if (emits) {
    tableVars.rebuildGroupsFn = rebuildGroups
  }

  /**
   * 统一的分组创建工厂方法
   * @param groupType 分组类型
   * @param position 左中右位置
   * @param x x坐标
   * @param y y坐标
   * @param options 可选配置（如裁剪参数）
   * @returns {Konva.Group}
   */
  const createGroup = (
    groupType: 'header' | 'body' | 'summary',
    position: 'left' | 'center' | 'right',
    x: number,
    y: number,
    options?: {
      clip?: {
        x: number
        y: number
        width: number
        height: number
      }
    }
  ): Konva.Group => {
    const groupName = `${position}-${groupType}-group`

    const groupConfig: Konva.GroupConfig = {
      x: position === 'left' ? 0 : x, // 左侧固定列的x永远为0
      y: position === 'center' && groupType !== 'header' ? y : groupType === 'header' ? 0 : y,
      name: groupName
    }

    // 如果是裁剪组，添加裁剪配置
    if (options?.clip) {
      groupConfig.clip = options.clip
    }

    return new Konva.Group(groupConfig)
  }

  /**
   * 创建中间表体剪辑组（特殊方法，因为需要裁剪功能）
   * @param x x坐标
   * @param y y坐标
   * @param clip 裁剪区域
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
  ): Konva.Group => {
    return new Konva.Group({
      x: x,
      y: y,
      name: 'center-body-clip-group',
      clip: clip
    })
  }

  /**
   * 批量创建同类型分组的方法
   * @param groupType 分组类型
   * @param positions 位置配置数组
   * @returns 创建的分组对象映射
   */
  const createGroupsByType = (
    groupType: 'header' | 'body' | 'summary',
    positions: Array<{
      position: 'left' | 'center' | 'right'
      x: number
      y: number
      options?: {
        clip?: {
          x: number
          y: number
          width: number
          height: number
        }
      }
    }>
  ) => {
    const groups: Record<string, Konva.Group> = {}

    positions.forEach(({ position, x, y, options }) => {
      const key = `${position}${groupType.charAt(0).toUpperCase() + groupType.slice(1)}Group`
      groups[key] = createGroup(groupType, position, x, y, options)
    })

    return groups
  }

  // 快捷方法 - 表头分组
  const createHeaderLeftGroups = (x: number, y: number) => createGroup('header', 'left', x, y)
  const createHeaderCenterGroups = (x: number, y: number) => createGroup('header', 'center', x, y)
  const createHeaderRightGroups = (x: number, y: number) => createGroup('header', 'right', x, y)

  // 快捷方法 - 表体分组
  const createBodyLeftGroups = (x: number, y: number) => createGroup('body', 'left', x, y)
  const createBodyCenterGroups = (x: number, y: number) => createGroup('body', 'center', x, y)
  const createBodyRightGroups = (x: number, y: number) => createGroup('body', 'right', x, y)

  // 快捷方法 - 汇总分组
  const createSummaryLeftGroups = (x: number, y: number) => createGroup('summary', 'left', x, y)
  const createSummaryCenterGroups = (x: number, y: number) => createGroup('summary', 'center', x, y)
  const createSummaryRightGroups = (x: number, y: number) => createGroup('summary', 'right', x, y)

  /**
   * 初始化全局事件监听器
   */
  const initStageListeners = () => {
    // 仅在提供 emits 时，注册依赖 emits 的全局事件监听器
    if (!emits) return
    window.addEventListener('resize', handleGlobalResize)
    // 注释鼠标移动监听以提升性能 - 这是主要的性能瓶颈
    // window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
  }

  /**
   * 清理全局事件监听器
   */
  const cleanupStageListeners = () => {
    if (!emits) return
    window.removeEventListener('resize', handleGlobalResize)
    // 注释鼠标移动监听清理
    // window.removeEventListener('mousemove', handleGlobalMouseMove)
    window.removeEventListener('mouseup', handleGlobalMouseUp)
  }

  return {
    initStage,
    destroyStage,
    getStageAttr,
    rebuildGroups,
    refreshTable,
    handleGlobalMouseMove,
    handleGlobalMouseUp,
    handleGlobalResize,
    clearGroups,
    initStageListeners,
    cleanupStageListeners,
    setPointerStyle,
    createGroup,
    createGroupsByType,
    createCenterBodyClipGroup
  }
}
