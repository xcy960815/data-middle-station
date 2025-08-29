import Konva from 'konva'
import { konvaStageHandler } from '../konva-stage-handler'
import { chartProps } from '../props'
import { adjustHexColorBrightness, getFromPool, getTextX, returnToPool, setPointerStyle, truncateText } from '../utils'
import { tableVars, type KonvaNodePools, type Prettify } from '../variable'
interface RenderBodyHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>

  getSummaryRowHeight: () => number
}

/**
 *
 * @param param0
 * @returns
 */
export const renderBodyHandler = ({ props, getSummaryRowHeight }: RenderBodyHandlerProps) => {
  const { getStageAttr } = konvaStageHandler()
  /**
   * 计算可视区域 数据的起始行和结束行
   * @returns {void}
   */
  const calculateVisibleRows = (activeData: Array<ChartDataVo.ChartData>) => {
    if (!tableVars.stage) return
    const stageHeight = tableVars.stage.height()
    const bodyHeight = stageHeight - props.headerHeight - getSummaryRowHeight() - props.scrollbarSize

    // 计算可视区域能显示的行数
    tableVars.visibleRowCount = Math.ceil(bodyHeight / props.bodyRowHeight)

    // 根据scrollY计算起始行
    const startRow = Math.floor(tableVars.stageScrollY / props.bodyRowHeight)

    // 算上缓冲条数的开始下标+结束下标
    tableVars.visibleRowStart = Math.max(0, startRow - props.bufferRows)
    tableVars.visibleRowEnd = Math.min(activeData.length - 1, startRow + tableVars.visibleRowCount + props.bufferRows)
  }
  /**
   * 在指定分组内创建单元格高亮矩形
   * @param x 矩形 X 坐标
   * @param y 矩形 Y 坐标
   * @param width 矩形宽度
   * @param height 矩形高度
   * @param group 分组
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
  const getSplitColumns = ({
    tableColumns,
    activeData
  }: {
    tableColumns: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>
    activeData: Array<ChartDataVo.ChartData>
  }) => {
    if (!tableVars.stage) {
      // 如果stage还没有初始化，返回默认值
      const leftCols = tableColumns.filter((c) => c.fixed === 'left')
      const rightCols = tableColumns.filter((c) => c.fixed === 'right')
      const centerCols = tableColumns.filter((c) => !c.fixed)
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
    const contentHeight = activeData.length * props.bodyRowHeight
    // 计算垂直滚动条预留空间
    const verticalScrollbarSpace =
      contentHeight > stageHeightRaw - props.headerHeight - getSummaryRowHeight() ? props.scrollbarSize : 0
    // 计算内容宽度
    const stageWidth = stageWidthRaw - verticalScrollbarSpace

    // 计算已设置宽度的列的总宽度
    const fixedWidthColumns = tableColumns.filter((c) => c.width !== undefined)
    const autoWidthColumns = tableColumns.filter((c) => c.width === undefined)
    const fixedTotalWidth = fixedWidthColumns.reduce((acc, c) => acc + (c.width || 0), 0)

    // 计算自动宽度列应该分配的宽度
    const remainingWidth = Math.max(0, stageWidth - fixedTotalWidth)
    const rawAutoWidth = autoWidthColumns.length > 0 ? remainingWidth / autoWidthColumns.length : 0
    const autoColumnWidth = Math.max(props.minAutoColWidth, rawAutoWidth)

    // 为每个列计算最终宽度（支持用户拖拽覆盖）
    const columnsWithWidth = tableColumns.map((col) => {
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
  const getScrollLimits = ({
    tableColumns,
    activeData
  }: {
    tableColumns: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>
    activeData: Array<ChartDataVo.ChartData>
  }) => {
    if (!tableVars.stage) return { maxScrollX: 0, maxScrollY: 0 }
    const { totalWidth, leftWidth, rightWidth } = getSplitColumns({ tableColumns, activeData })

    const stageWidth = tableVars.stage.width()
    const stageHeight = tableVars.stage.height()

    // 计算内容高度
    let contentHeight = activeData.length * props.bodyRowHeight

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

  /**
   * 判断坐标是否在表格区域内（排除滚动条区域）
   * @param clientX 客户端X坐标
   * @param clientY 客户端Y坐标
   * @returns 是否在表格区域内
   */
  const isInTableArea = ({
    tableColumns,
    activeData
  }: {
    tableColumns: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>
    activeData: Array<ChartDataVo.ChartData>
  }) => {
    if (!tableVars.stage) return false

    // 转换为 stage 坐标
    const pointerPosition = tableVars.stage.getPointerPosition()
    if (!pointerPosition) return false

    const { width: stageWidth, height: stageHeight } = getStageAttr()
    const { maxScrollX, maxScrollY } = getScrollLimits({ tableColumns: tableColumns, activeData: activeData })

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
   * 为按钮矩形绑定“原生按钮”式动效（hover/active 阴影与亮度变化）
   */
  const bindButtonInteractions = (
    buttonRect: Konva.Rect,
    options: {
      baseFill: string
      baseStroke: string
      layer: Konva.Layer | null
      disabled?: boolean
    }
  ) => {
    let isHovering = false

    const hoverFill = adjustHexColorBrightness(options.baseFill, 8)
    const activeFill = adjustHexColorBrightness(options.baseFill, -8)
    const original = { x: buttonRect.x(), y: buttonRect.y(), w: buttonRect.width(), h: buttonRect.height() }

    const applyNormal = () => {
      buttonRect.fill(options.baseFill)
      buttonRect.shadowOpacity(0)
      buttonRect.shadowBlur(0)
      buttonRect.shadowOffset({ x: 0, y: 0 })
      buttonRect.to({
        x: original.x,
        y: original.y,
        scaleX: 1,
        scaleY: 1,
        duration: 0.08,
        easing: Konva.Easings.EaseInOut
      })
      options.layer?.batchDraw()
    }
    const applyHover = () => {
      buttonRect.fill(hoverFill)
      buttonRect.shadowColor(options.baseFill)
      buttonRect.shadowOpacity(0.25)
      buttonRect.shadowBlur(8)
      buttonRect.shadowOffset({ x: 0, y: 1 })
      buttonRect.to({
        x: original.x,
        y: original.y,
        scaleX: 1,
        scaleY: 1,
        duration: 0.08,
        easing: Konva.Easings.EaseInOut
      })
      options.layer?.batchDraw()
    }
    const applyActive = () => {
      buttonRect.fill(activeFill)
      buttonRect.shadowColor(options.baseFill)
      buttonRect.shadowOpacity(0.2)
      buttonRect.shadowBlur(4)
      buttonRect.shadowOffset({ x: 0, y: 0 })
      const sx = 0.98
      const sy = 0.98
      const dx = (original.w * (1 - sx)) / 2
      const dy = (original.h * (1 - sy)) / 2
      buttonRect.to({
        x: original.x + dx,
        y: original.y + dy,
        scaleX: sx,
        scaleY: sy,
        duration: 0.06,
        easing: Konva.Easings.EaseInOut
      })
      options.layer?.batchDraw()
    }

    // 清理旧事件并绑定
    buttonRect.off('mouseenter.buttonfx')
    buttonRect.off('mouseleave.buttonfx')
    buttonRect.off('mousedown.buttonfx')
    buttonRect.off('mouseup.buttonfx')

    if (options.disabled) {
      buttonRect.opacity(0.6)
      buttonRect.on('mouseenter.buttonfx', () => {
        setPointerStyle(tableVars.stage, false, 'not-allowed')
      })
      buttonRect.on('mouseleave.buttonfx', () => {
        setPointerStyle(tableVars.stage, false, 'default')
      })
      return
    }

    buttonRect.opacity(1)
    buttonRect.on('mouseenter.buttonfx', () => {
      isHovering = true
      setPointerStyle(tableVars.stage, true, 'pointer')
      applyHover()
    })
    buttonRect.on('mouseleave.buttonfx', () => {
      isHovering = false
      setPointerStyle(tableVars.stage, false, 'default')
      applyNormal()
    })
    buttonRect.on('mousedown.buttonfx', () => {
      applyActive()
    })
    buttonRect.on('mouseup.buttonfx', () => {
      if (isHovering) applyHover()
      else applyNormal()
    })
  }

  const drawBackgroundRect = (
    bodyGroup: Konva.Group,
    bodyCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    pools: KonvaNodePools,
    rowIndex: number
  ) => {
    // 分组总宽度
    const groupTotalWidth = bodyCols.reduce((acc, c) => acc + (c.width || 0), 0)
    const backgroundRect = getFromPool(
      pools.backgroundRects,
      () => new Konva.Rect({ listening: false, name: 'background-rect' })
    )
    // y坐标
    const y = rowIndex * props.bodyRowHeight
    backgroundRect.name('background-rect')
    backgroundRect.setAttr('row-index', null)
    backgroundRect.setAttr('col-index', null)
    backgroundRect.x(0)
    backgroundRect.y(y)
    backgroundRect.width(groupTotalWidth)
    backgroundRect.height(props.bodyRowHeight)
    const backgroundColor = rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven
    backgroundRect.fill(backgroundColor)
    bodyGroup.add(backgroundRect)
    backgroundRect.moveToBottom()
  }

  const drawMergedCellRect = ({
    pools,
    rowIndex,
    colIndex,
    startColIndex,
    x,
    y,
    cellWidth,
    cellHeight
  }: {
    pools: KonvaNodePools
    rowIndex: number
    colIndex: number
    startColIndex: number
    x: number
    y: number
    cellWidth: number
    cellHeight: number
  }) => {
    const mergedCellRect = getFromPool(
      pools.mergedCellRects,
      () => new Konva.Rect({ listening: false, name: 'merged-cell-rect' })
    )
    mergedCellRect.name('merged-cell-rect')
    mergedCellRect.setAttr('row-index', rowIndex + 1)
    mergedCellRect.setAttr('col-index', colIndex + startColIndex)
    mergedCellRect.x(x)
    mergedCellRect.y(y)
    mergedCellRect.width(cellWidth)
    mergedCellRect.height(cellHeight)
    // 使用起始行的背景色以保持整体风格一致
    mergedCellRect.fill(rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven)
    mergedCellRect.stroke(props.borderColor)
    mergedCellRect.strokeWidth(1)

    return mergedCellRect
  }

  const drawMergedCellText = ({
    pools,
    row,
    col,
    x,
    y,
    cellWidth,
    cellHeight
  }: {
    pools: KonvaNodePools
    row: ChartDataVo.ChartData
    col: GroupStore.GroupOption | DimensionStore.DimensionOption
    x: number
    y: number
    cellWidth: number
    cellHeight: number
  }) => {
    // 在合并单元格中绘制文本
    const rawValue = row && typeof row === 'object' ? row[col.columnName] : undefined
    const value = String(rawValue ?? '')
    const maxTextWidth = cellWidth - 16
    const fontFamily = props.bodyFontFamily
    const fontSize = typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize
    const truncatedValue = truncateText(value, maxTextWidth, fontSize, fontFamily)
    const mergedCellText = getFromPool(
      pools.mergedCellTexts,
      () => new Konva.Text({ listening: false, name: 'merged-cell-text' })
    )
    mergedCellText.name('merged-cell-text')
    mergedCellText.setAttr('row-index', null)
    mergedCellText.setAttr('col-index', null)
    mergedCellText.x(getTextX(x))
    mergedCellText.y(y + cellHeight / 2)
    mergedCellText.text(truncatedValue)
    mergedCellText.fontSize(fontSize)
    mergedCellText.fontFamily(fontFamily)
    // 填充文字颜色
    mergedCellText.fill(props.bodyTextColor)
    mergedCellText.align('left')
    mergedCellText.verticalAlign('middle')
    mergedCellText.offsetY(mergedCellText.height() / 2)

    return mergedCellText
  }

  const drawCellRect = ({
    pools,
    rowIndex,
    colIndex,
    startColIndex,
    x,
    y,
    cellWidth,
    cellHeight
  }: {
    pools: KonvaNodePools
    rowIndex: number
    colIndex: number
    startColIndex: number
    x: number
    y: number
    cellWidth: number
    cellHeight: number
  }) => {
    const cellRect = getFromPool(pools.cellRects, () => new Konva.Rect({ listening: true, name: 'cell-rect' }))
    cellRect.name('cell-rect')
    cellRect.setAttr('row-index', rowIndex + 1)
    cellRect.setAttr('col-index', colIndex + startColIndex)
    cellRect.x(x)
    cellRect.y(y)
    cellRect.width(cellWidth)
    cellRect.height(cellHeight)
    cellRect.stroke(props.borderColor)
    cellRect.strokeWidth(1)
    cellRect.off('click')
    return cellRect
  }

  const drawCellText = ({
    pools,
    x,
    y,
    cellHeight,
    truncatedValue,
    fontSize,
    fontFamily
  }: {
    pools: KonvaNodePools
    x: number
    y: number
    cellHeight: number
    truncatedValue: string
    fontSize: number
    fontFamily: string
  }) => {
    const cellText = getFromPool(pools.cellTexts, () => new Konva.Text({ listening: false, name: 'cell-text' }))
    cellText.name('cell-text')
    cellText.setAttr('row-index', null)
    cellText.setAttr('col-index', null)
    cellText.x(getTextX(x))
    cellText.y(y + cellHeight / 2)
    cellText.text(truncatedValue)
    cellText.fontSize(fontSize)
    cellText.fontFamily(fontFamily)
    cellText.fill(props.bodyTextColor)
    cellText.align('left')
    cellText.verticalAlign('middle')
    cellText.offsetY(cellText.height() / 2)

    return cellText
  }

  const drawButtonRect = ({
    pools,
    startX,
    centerY,
    w,
    buttonHeight,
    theme
  }: {
    pools: KonvaNodePools
    startX: number
    centerY: number
    w: number
    buttonHeight: number
    theme: { fill: string; stroke: string }
  }) => {
    const buttonRect = getFromPool(
      pools.backgroundRects,
      () => new Konva.Rect({ listening: true, name: `button-rect` })
    )
    buttonRect.name('button-rect')
    buttonRect.off('click')
    buttonRect.off('mouseenter')
    buttonRect.off('mouseleave')
    buttonRect.setAttr('row-index', null)
    buttonRect.setAttr('col-index', null)
    buttonRect.x(startX)
    buttonRect.y(centerY)
    buttonRect.width(w)
    buttonRect.height(buttonHeight)
    buttonRect.cornerRadius(4)
    buttonRect.fill(theme.fill)
    buttonRect.stroke(theme.stroke)
    buttonRect.strokeWidth(1)

    return buttonRect
  }

  const drawButtonText = ({
    pools,
    x,
    y,
    buttonName,
    fontSize,
    fontFamily,
    opacity,
    textColor,
    offsetX,
    offsetY
  }: {
    pools: KonvaNodePools
    x: number
    y: number
    buttonName: string
    fontSize: number
    fontFamily: string
    opacity: number
    textColor: string
    offsetX: number
    offsetY: number
  }) => {
    const buttonCellText = getFromPool(
      pools.cellTexts,
      () => new Konva.Text({ listening: false, name: 'button-cell-text' })
    )
    buttonCellText.name('button-cell-text')
    buttonCellText.x(x)
    buttonCellText.y(y)
    buttonCellText.text(buttonName)
    buttonCellText.fontSize(fontSize)
    buttonCellText.fontFamily(fontFamily)
    buttonCellText.fill(textColor)
    buttonCellText.opacity(opacity)
    buttonCellText.align('center')
    buttonCellText.verticalAlign('middle')
    buttonCellText.offset({ x: offsetX, y: offsetY })

    return buttonCellText
  }

  return {
    createHighlightRect,
    calculateVisibleRows,
    recoverKonvaNode,
    getScrollLimits,
    getSplitColumns,
    isInTableArea,
    bindButtonInteractions,
    drawBackgroundRect,
    drawMergedCellRect,
    drawMergedCellText,
    drawCellRect,
    drawCellText,
    drawButtonRect,
    drawButtonText
  }
}
