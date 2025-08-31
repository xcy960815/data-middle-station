import Konva from 'konva'
import { editorDropdownHandler } from '../dropdown/editor-dropdown-handler'
import { filterDropdownHandler } from '../dropdown/filter-dropdown-handler'
import { summaryDropDownHandler } from '../dropdown/summary-dropdown-handler'
import type { CanvasTableEmits } from '../emits'
import { konvaStageHandler } from '../konva-stage-handler'
import { chartProps } from '../props'
import {
  adjustHexColorBrightness,
  estimateButtonWidth,
  getFromPool,
  getTableContainerElement,
  getTextX,
  returnToPool,
  truncateText
} from '../utils'
import { variableHandlder, type KonvaNodePools, type PositionMap, type Prettify } from '../variable-handlder'
import { highlightHandler } from './heightlight-handler'
interface RenderBodyHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
  emits: <T extends keyof CanvasTableEmits>(event: T, ...args: CanvasTableEmits[T]) => void
}

export const renderBodyHandler = ({ props, emits }: RenderBodyHandlerProps) => {
  const { updateHoverRects } = highlightHandler({ props })
  const { filterDropdown } = filterDropdownHandler({ props })
  const { cellEditorDropdown, resetCellEditorDropdown, openCellEditorDropdown } = editorDropdownHandler({
    props,
    emits
  })
  const { tableColumns, tableData, tableVars } = variableHandlder({ props })
  const { getStageAttr, setPointerStyle } = konvaStageHandler({ props })
  const { getSummaryRowHeight, summaryDropdown } = summaryDropDownHandler({ props })

  // Define button palette options
  const paletteOptions = {
    primary: { fill: '#1890ff', stroke: '#1890ff', text: '#fff' },
    success: { fill: '#52c41a', stroke: '#52c41a', text: '#fff' },
    warning: { fill: '#faad14', stroke: '#faad14', text: '#fff' },
    danger: { fill: '#ff4d4f', stroke: '#ff4d4f', text: '#fff' },
    default: { fill: '#f5f5f5', stroke: '#d9d9d9', text: '#000' }
  }
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
      tableData.value.length - 1,
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
          returnToPool(pools.cellTexts, child)
        }
        const isCellText = child.name() === 'cell-text'
        if (isCellText) {
          returnToPool(pools.cellTexts, child)
        }
      }
      if (isRect) {
        const isMergedCellRect = child.name() === 'merged-cell-rect'
        if (isMergedCellRect) {
          returnToPool(pools.cellRects, child)
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

    const { width: stageWidth, height: stageHeight } = getStageAttr()

    // 计算内容高度
    const contentHeight = tableData.value.length * props.bodyRowHeight

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
        setPointerStyle(false, 'not-allowed')
      })
      buttonRect.on('mouseleave.buttonfx', () => {
        setPointerStyle(false, 'default')
      })
      return
    }

    buttonRect.opacity(1)
    buttonRect.on('mouseenter.buttonfx', () => {
      isHovering = true
      setPointerStyle(true, 'pointer')
      applyHover()
    })
    buttonRect.on('mouseleave.buttonfx', () => {
      isHovering = false
      setPointerStyle(false, 'default')
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
      pools.cellTexts,
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

  /**
   * 绘制单元格矩形
   * @param {KonvaNodePools} param0.pools
   * @param {number} param0.rowIndex
   * @param {number} param0.colIndex
   * @param {number} param0.startColIndex
   * @param {number} param0.x
   * @param {number} param0.y
   * @param {number} param0.cellWidth
   * @param {number} param0.cellHeight
   * @returns
   */
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
    const background = rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven
    const cellRect = getFromPool(pools.cellRects, () => new Konva.Rect({ listening: true, name: 'cell-rect' }))
    cellRect.name('cell-rect')
    cellRect.setAttr('row-index', rowIndex + 1)
    cellRect.setAttr('col-index', colIndex + startColIndex)
    cellRect.x(x)
    cellRect.y(y)
    cellRect.setAttr('origin-fill', background)
    cellRect.fill(background)
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
      pools.cellRects || [],
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

  /**
   *
   * 画body区域 只渲染可视区域的行
   * @param {Konva.Group | null} group 分组
   * @param {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>} cols 列
   * @param {ObjectPools} pools 对象池
   * @param {number} startColIndex 起始列索引
   * @param {PositionMap[]} positionMapList 位置映射列表
   * @param {number} stageStartX 舞台起始X坐标
   * @returns {void}
   */
  const drawBodyPart = (
    bodyGroup: Konva.Group | null,
    bodyCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    pools: KonvaNodePools,
    startColIndex: number,
    positionMapList: PositionMap[],
    stageStartX: number
  ) => {
    if (!tableVars.stage || !bodyGroup) return

    calculateVisibleRows()
    // 预计算：字体、span 方法、全局列索引映射、操作列按钮宽度
    const bodyFontFamily = props.bodyFontFamily
    const bodyFontSizeNumber =
      typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize
    const spanMethod = typeof props.spanMethod === 'function' ? props.spanMethod : null
    const hasSpanMethod = !!spanMethod

    const globalIndexByColName = new Map<string, number>()
    tableColumns.value.forEach((c, idx) => globalIndexByColName.set(c.columnName as string, idx))

    const actionWidthsMap = new Map<string, { widths: number[]; totalWidth: number }>()
    const buttonGap = 6
    for (let i = 0; i < bodyCols.length; i++) {
      const col = bodyCols[i]
      // 仅为操作列预估按钮宽度（与行无关，避免在行循环中重复计算）
      const actions = col.actions as Array<{ label: string }> | undefined
      if (col.columnName === 'action' && actions && actions.length > 0) {
        const widths = actions.map((a) => estimateButtonWidth(a.label, bodyFontSizeNumber, bodyFontFamily))
        const totalWidth = widths.reduce((a, b) => a + b, 0) + buttonGap * (actions.length - 1)
        actionWidthsMap.set(col.columnName as string, { widths, totalWidth })
      }
    }

    recoverKonvaNode(bodyGroup, pools)
    // 渲染可视区域的行
    for (let rowIndex = tableVars.visibleRowStart; rowIndex <= tableVars.visibleRowEnd; rowIndex++) {
      const row = tableData.value[rowIndex]
      // y坐标
      const y = rowIndex * props.bodyRowHeight
      // 渲染每列的单元格
      let x = 0
      for (let colIndex = 0; colIndex < bodyCols.length; colIndex++) {
        const col = bodyCols[colIndex]
        const columnWidth = col.width || 0
        // 跳过零宽列
        if (columnWidth <= 0) {
          x += columnWidth
          continue
        }
        let spanRow = 1
        let spanCol = 1
        let coveredBySpanMethod = false
        const globalColIndex = globalIndexByColName.get(col.columnName as string) ?? colIndex
        if (hasSpanMethod && spanMethod) {
          const res = spanMethod({ row, column: col, rowIndex, colIndex: globalColIndex })
          if (Array.isArray(res)) {
            spanRow = Math.max(0, Number(res[0]) || 0)
            spanCol = Math.max(0, Number(res[1]) || 0)
          } else if (res && typeof res === 'object') {
            spanRow = Math.max(0, Number(res.rowspan) || 0)
            spanCol = Math.max(0, Number(res.colspan) || 0)
          }
          // 只要任一维度为 0，即视为被合并覆盖（与常见表格合并语义一致）
          if (spanRow === 0 || spanCol === 0) coveredBySpanMethod = true
        }

        const shouldDraw = !hasSpanMethod || !coveredBySpanMethod

        if (!shouldDraw) {
          x += columnWidth
          continue
        }

        const computedRowSpan = hasSpanMethod ? spanRow : 1

        const cellHeight = computedRowSpan * props.bodyRowHeight

        // 计算合并单元格的宽度（此处暂未实现跨列合并的宽度累加，保持原逻辑）
        let cellWidth = columnWidth

        // 记录可视区域内主体单元格位置信息（使用舞台坐标）
        positionMapList.push({
          x: stageStartX + x,
          y: y + props.headerHeight,
          width: cellWidth,
          height: cellHeight,
          rowIndex: rowIndex + 1,
          colIndex: colIndex + startColIndex
        })
        // 若为合并单元格（跨行或跨列），在行斑马纹之上绘制统一背景色，避免内部出现条纹断层
        if (hasSpanMethod && (computedRowSpan > 1 || spanCol > 1)) {
          const mergedCellRect = drawCellRect({
            pools,
            rowIndex,
            colIndex,
            startColIndex,
            x,
            y,
            cellWidth,
            cellHeight
          })
          bodyGroup.add(mergedCellRect)
          const mergedCellText = drawMergedCellText({
            pools,
            row,
            col,
            x,
            y,
            cellWidth,
            cellHeight
          })
          bodyGroup.add(mergedCellText)
        } else {
          const cellRect = drawCellRect({
            pools,
            rowIndex,
            colIndex,
            startColIndex,
            x,
            y,
            cellWidth,
            cellHeight
          })
          let clickTimeout: NodeJS.Timeout | null = null
          // 添加点击事件
          cellRect.on('click', () => {
            if (clickTimeout) {
              clearTimeout(clickTimeout)
              clickTimeout = null
              return
            }
            clickTimeout = setTimeout(() => {
              handleCellClick(rowIndex, colIndex, col, cellRect.x(), cellRect.y(), cellWidth, cellHeight, bodyGroup)
              clickTimeout = null
            }, 250) // 250ms 内未发生第二次点击 → 认定为单击
          })
          cellRect.on('dblclick', () => {
            handleCellDoubleClick(
              rowIndex,
              colIndex + startColIndex,
              col,
              cellRect.x(),
              cellRect.y(),
              cellWidth,
              cellHeight
            )
          })

          bodyGroup.add(cellRect)
          // 如果是操作列，绘制按钮；否则绘制文本
          if (col.columnName === 'action') {
            const actions = col.actions as
              | Array<{
                  key: string
                  label: string
                  type?: keyof typeof paletteOptions
                  disabled?: boolean | ((row: any, rowIndex: number) => boolean)
                }>
              | undefined
            const buttonHeight = Math.max(22, Math.min(28, cellHeight - 8))
            if (actions && actions.length > 0) {
              const preset = actionWidthsMap.get(col.columnName as string)
              const widths = preset
                ? preset.widths
                : actions.map((a) => estimateButtonWidth(a.label, bodyFontSizeNumber, bodyFontFamily))
              const totalButtonsWidth = preset
                ? preset.totalWidth
                : widths.reduce((a, b) => a + b, 0) + buttonGap * (actions.length - 1)
              let startX = x + (cellWidth - totalButtonsWidth) / 2
              const centerY = y + (cellHeight - buttonHeight) / 2
              actions.forEach((action, idx) => {
                const w = widths[idx]
                const theme = paletteOptions[action.type || 'primary'] || paletteOptions.primary
                const buttonRect = drawButtonRect({ pools, startX, centerY, w, buttonHeight, theme })
                const isDisabled =
                  typeof action.disabled === 'function'
                    ? action.disabled(tableData.value[rowIndex], rowIndex)
                    : !!action.disabled
                bindButtonInteractions(buttonRect, {
                  baseFill: theme.fill,
                  baseStroke: theme.stroke,
                  layer: bodyGroup.getLayer(),
                  disabled: isDisabled
                })
                buttonRect.on('click', () => {
                  if (isDisabled) return
                  const rowData = tableData.value[rowIndex]
                  emits('action-click', { rowIndex, action: action.key, rowData })
                })
                bodyGroup.add(buttonRect)
                const x = startX + w / 2
                const y = centerY + buttonHeight / 2
                const buttonName = action.label
                const fontFamily = bodyFontFamily
                const opacity = isDisabled ? 0.6 : 1
                const textColor = theme.text
                const offsetX = buttonRect.width() / 2
                const offsetY = buttonRect.height() / 2
                const buttonText = drawButtonText({
                  pools,
                  x,
                  y,
                  buttonName,
                  fontSize: bodyFontSizeNumber,
                  fontFamily,
                  opacity,
                  textColor,
                  offsetX,
                  offsetY
                })
                bodyGroup.add(buttonText)

                startX += w + buttonGap
              })
            }
          } else {
            // 创建文本
            const rawValue = row && typeof row === 'object' ? row[col.columnName] : undefined
            const value = String(rawValue ?? '')
            const maxTextWidth = cellWidth - 16
            const fontFamily = bodyFontFamily
            const fontSize = bodyFontSizeNumber

            const truncatedValue = truncateText(value, maxTextWidth, fontSize, fontFamily)

            const cellText = drawCellText({
              pools,
              x,
              y,
              cellHeight,
              truncatedValue,
              fontSize,
              fontFamily
            })
            bodyGroup.add(cellText)

            const colShowOverflow = col.showOverflowTooltip
            const enableTooltip = colShowOverflow !== undefined ? colShowOverflow : false
            if (enableTooltip && truncatedValue !== value) {
              // 悬浮提示：仅在文本被截断时创建 Konva.Tooltip 等价层
              // 这里用浏览器原生 title 实现，命中区域为单元格矩形
              // Konva 没有内置 tooltip，避免复杂度，先用 title
              cellRect.off('mouseenter.tooltip')
              cellRect.on('mouseenter.tooltip', () => {
                if (!tableVars.stage) return
                // 设置 container 的 title
                tableVars.stage.container().setAttribute('title', String(rawValue ?? ''))
              })
              cellRect.off('mouseleave.tooltip')
              cellRect.on('mouseleave.tooltip', () => {
                if (!tableVars.stage) return
                // 清除 title，避免全局悬浮
                tableVars.stage.container().removeAttribute('title')
              })
            }
          }
        }
        x += col.width || 0
      }
    }
    // 渲染完成后，重新计算 行下标 列下标
    recomputeHoverIndexFromPointer()

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
   * @param {number} colIndex 列索引
   * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} col 列配置
   * @param {number} cellX 单元格 X 坐标
   * @param {number} cellY 单元格 Y 坐标
   * @param {number} cellWidth 单元格宽度
   * @param {number} cellHeight 单元格高度
   * @param {Konva.Group} group 分组
   */
  const handleCellClick = (
    rowIndex: number,
    colIndex: number,
    col: GroupStore.GroupOption | DimensionStore.DimensionOption,
    cellX: number,
    cellY: number,
    cellWidth: number,
    cellHeight: number,
    group: Konva.Group
  ) => {
    createHighlightRect(cellX, cellY, cellWidth, cellHeight, group)
    const rowData = tableData.value[rowIndex]
    emits('cell-click', { rowIndex, colIndex, colKey: col.columnName, rowData })
  }

  /**
   * 处理单元格双击
   */
  const handleCellDoubleClick = (
    rowIndex: number,
    colIndex: number,
    column: GroupStore.GroupOption | DimensionStore.DimensionOption,
    cellX: number,
    cellY: number,
    cellWidth: number,
    cellHeight: number
  ) => {
    // 操作列不允许编辑
    if (column.columnName === 'action') return

    // 如果已经在编辑，先重置
    if (cellEditorDropdown.visible) {
      resetCellEditorDropdown()
      // 添加小延时确保重置完成
      setTimeout(() => {
        openCellEditorDropdown(rowIndex, colIndex, column, cellX, cellY, cellWidth, cellHeight)
      }, 10)
      return
    }

    openCellEditorDropdown(rowIndex, colIndex, column, cellX, cellY, cellWidth, cellHeight)
  }

  /**
   * 判断当前指针位置的顶层元素是否属于表格容器
   * 若不属于，则认为表格被其它遮罩/弹层覆盖，此时不进行高亮
   * @param {number} clientX 鼠标点击位置的 X 坐标
   * @param {number} clientY 鼠标点击位置的 Y 坐标
   * @returns {boolean} 是否在表格容器内
   */
  const isTopMostInTable = (clientX: number, clientY: number): boolean => {
    const container = getTableContainerElement()
    if (!container) return false
    const topEl = document.elementFromPoint(clientX, clientY) as HTMLElement | null
    if (!topEl) return false
    if (!container.contains(topEl)) return false
    // 仅当命中的元素为 Konva 的 canvas（或其包裹层）时，认为没有被遮罩覆盖
    if (topEl.tagName === 'CANVAS') return true
    const konvaContent = topEl.closest('.konvajs-content') as HTMLElement | null
    if (konvaContent && container.contains(konvaContent)) return true
    // 命中的虽然在容器内，但不是 Konva 画布，视为被遮罩覆盖
    return false
  }

  /**
   * 基于当前指针位置重新计算 行下标 列下标
   * @returns {void}
   */
  const recomputeHoverIndexFromPointer = () => {
    if (
      !tableVars.stage ||
      (!props.enableRowHoverHighlight && !props.enableColHoverHighlight) ||
      filterDropdown.visible ||
      summaryDropdown.visible
    ) {
      return
    }

    // 清除高亮的辅助函数
    const clearHoverHighlight = () => {
      if (tableVars.hoveredRowIndex !== null || tableVars.hoveredColIndex !== null) {
        tableVars.hoveredRowIndex = null
        tableVars.hoveredColIndex = null
        updateHoverRects()
      }
    }

    // 检查各种边界条件，如果不符合则清除高亮并返回
    if (!isTopMostInTable(tableVars.lastClientX, tableVars.lastClientY)) {
      clearHoverHighlight()
      return
    }

    const pointerPosition = tableVars.stage.getPointerPosition()
    if (!pointerPosition) {
      clearHoverHighlight()
      return
    }

    /**
     * 检查鼠标是否在表格区域内（排除滚动条区域）
     */
    if (!isInTableArea()) {
      clearHoverHighlight()
      return
    }

    const localY = pointerPosition.y + tableVars.stageScrollY
    const localX = pointerPosition.x + tableVars.stageScrollX
    // 计算鼠标所在的行索引
    const positionMapList = [
      ...tableVars.headerPositionMapList,
      ...tableVars.bodyPositionMapList,
      ...tableVars.summaryPositionMapList
    ]
    const positionOption = positionMapList.find(
      (item) => localX >= item.x && localX <= item.x + item.width && localY >= item.y && localY <= item.y + item.height
    )
    let newHoveredRowIndex = null
    let newHoveredColIndex = null
    if (positionOption) {
      newHoveredRowIndex = positionOption.rowIndex
      newHoveredColIndex = positionOption.colIndex
    }
    const rowChanged = newHoveredRowIndex !== tableVars.hoveredRowIndex
    const colChanged = newHoveredColIndex !== tableVars.hoveredColIndex
    if (rowChanged) {
      tableVars.hoveredRowIndex = newHoveredRowIndex
    }
    if (colChanged) {
      tableVars.hoveredColIndex = newHoveredColIndex
    }

    if (rowChanged || colChanged) {
      updateHoverRects()
    }
  }

  return {
    recomputeHoverIndexFromPointer,
    createHighlightRect,
    calculateVisibleRows,
    recoverKonvaNode,
    getScrollLimits,
    getSplitColumns,
    isInTableArea,
    bindButtonInteractions,
    drawMergedCellText,
    drawCellRect,
    drawCellText,
    drawButtonRect,
    drawButtonText,
    drawBodyPart
  }
}
