import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { ref } from 'vue'
import CellEditor from './components/cell-editor.vue'
import { staticParams, tableData } from './parameter'
import { scrollbarVars } from './scrollbar-handler'
import { getStageSize, stageVars } from './stage-handler'
import { getSummaryRowHeight } from './summary-handler'
import {
  calculateTextWidth,
  createGroup,
  drawUnifiedRect,
  drawUnifiedText,
  getCellDisplayContent,
  recoverKonvaNode,
  truncateText
} from './utils'

import type { KonvaNodePools } from './utils'

interface BodyVars {
  /**
   * 左侧主体组对象池
   */
  leftBodyPools: KonvaNodePools
  /**
   * 中间主体组对象池
   */
  centerBodyPools: KonvaNodePools
  /**
   * 右侧主体组对象池
   */
  rightBodyPools: KonvaNodePools

  bodyLayer: Konva.Layer | null
  /**
   * 固定表body层
   */
  fixedBodyLayer: Konva.Layer | null

  /**
   * 左侧主体组
   */
  leftBodyGroup: Konva.Group | null
  /**
   * 中间主体组
   */
  centerBodyGroup: Konva.Group | null
  /**
   * 右侧主体组
   */
  rightBodyGroup: Konva.Group | null
  highlightRect: Konva.Rect | null
  visibleRowStart: number
  visibleRowEnd: number
  visibleRowCount: number
}

export const bodyVars: BodyVars = {
  leftBodyPools: {
    cellRects: [],
    cellTexts: []
  },
  centerBodyPools: {
    cellRects: [],
    cellTexts: []
  },
  rightBodyPools: {
    cellRects: [],
    cellTexts: []
  },
  bodyLayer: null,
  fixedBodyLayer: null,
  leftBodyGroup: null,
  centerBodyGroup: null,
  rightBodyGroup: null,
  /**
   * 高亮矩形
   */
  highlightRect: null,
  visibleRowStart: 0,
  visibleRowEnd: 0,
  visibleRowCount: 0
}

/**
 * 单元格编辑器组件引用
 */
export const cellEditorRef = ref<InstanceType<typeof CellEditor> | null>(null)

/**
 * 创建body左侧组
 * @param x x坐标
 * @param y y坐标
 * @returns {Konva.Group} body组
 */
export const createBodyLeftGroup = (x: number, y: number) => createGroup('body', 'left', x, y)
/**
 * 创建body中间组
 * @param x x坐标
 * @param y y坐标
 * @returns {Konva.Group} body组
 */
export const createBodyCenterGroup = (x: number, y: number) => createGroup('body', 'center', x, y)
/**
 * 创建body右侧组
 * @param x x坐标
 * @param y y坐标
 * @returns {Konva.Group} body组
 */
export const createBodyRightGroup = (x: number, y: number) => createGroup('body', 'right', x, y)

/**
 * 裁剪区域宽度高度
 */
interface ClipOptions {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 创建body左侧裁剪组
 * @param x x坐标
 * @param y y坐标
 * @param {Object} clipOptions - 裁剪区域宽度高度
 * @returns {Konva.Group} body组
 */
export const createLeftBodyClipGroup = (x: number, y: number, clipOptions: ClipOptions) =>
  createGroup('body', 'left', x, y, clipOptions)
/**
 * 创建body中间裁剪组
 * @param x x坐标
 * @param y y坐标
 * @param {Object} clipOptions - 裁剪区域宽度高度
 * @returns {Konva.Group} body组
 */
export const createCenterBodyClipGroup = (x: number, y: number, clipOptions: ClipOptions) =>
  createGroup('body', 'center', x, y, clipOptions)
/**
 * 创建body右侧裁剪组
 * @param x x坐标
 * @param y y坐标
 * @param {Object} clipOptions - 裁剪区域宽度高度
 * @returns {Konva.Group} body组
 */
export const createRightBodyClipGroup = (x: number, y: number, clipOptions: ClipOptions) =>
  createGroup('body', 'right', x, y, clipOptions)

/**
 * 计算可视区域数据的起始行和结束行
 * @returns {void}
 */
export const calculateVisibleRows = () => {
  if (!stageVars.stage) return

  const { height: stageHeight } = getStageSize()

  const bodyHeight = stageHeight - staticParams.headerRowHeight - getSummaryRowHeight() - staticParams.scrollbarSize

  // 计算可视区域能显示的行数
  bodyVars.visibleRowCount = Math.ceil(bodyHeight / staticParams.bodyRowHeight)

  // 根据scrollY计算起始行
  const startRow = Math.floor(scrollbarVars.stageScrollY / staticParams.bodyRowHeight)

  // 算上缓冲条数的开始下标+结束下标
  bodyVars.visibleRowStart = Math.max(0, startRow - staticParams.bufferRows)

  bodyVars.visibleRowEnd = Math.min(
    tableData.value.length - 1,
    startRow + bodyVars.visibleRowCount + staticParams.bufferRows
  )
}

/**
 * 列信息存储结果
 */
interface ColumnsInfo {
  leftColumns: Array<CanvasTable.GroupOption | CanvasTable.DimensionOption>
  centerColumns: Array<CanvasTable.GroupOption | CanvasTable.DimensionOption>
  rightColumns: Array<CanvasTable.GroupOption | CanvasTable.DimensionOption>
  leftPartWidth: number
  centerPartWidth: number
  rightPartWidth: number
  totalWidth: number
}

/**
 * 已计算的列信息（可以直接访问使用）
 */
export const columnsInfo: ColumnsInfo = {
  leftColumns: [],
  centerColumns: [],
  rightColumns: [],
  leftPartWidth: 0,
  centerPartWidth: 0,
  rightPartWidth: 0,
  totalWidth: 0
}

/**
 * 计算并更新列信息（主动计算）
 * 应该在以下情况调用：
 * 1. Stage 初始化后
 * 2. 窗口 resize
 * 3. 列配置变化
 * 4. 数据总行数变化（影响垂直滚动条）
 */
export const calculateColumnsInfo = () => {
  const { width: stageWidthRaw, height: stageHeightRaw } = getStageSize()
  const { xAxisFields, yAxisFields, bodyRowHeight, headerRowHeight, scrollbarSize, minAutoColWidth } = staticParams

  // 数据区高度
  const contentHeight = tableData.value.length * bodyRowHeight

  // 是否需要垂直滚动条
  const needVScroll = contentHeight > stageHeightRaw - headerRowHeight - getSummaryRowHeight()
  const verticalScrollbarSpace = needVScroll ? scrollbarSize : 0

  // 可用宽度
  const stageWidth = stageWidthRaw - verticalScrollbarSpace

  // 🔹先拼出所有列
  const tableColumnsRaw = [...xAxisFields, ...yAxisFields].map((col, index) => ({
    ...col,
    align: col.align ?? 'left',
    verticalAlign: col.verticalAlign ?? 'middle',
    colIndex: index
  }))

  // 🔹先统计已固定宽度列的总宽度
  const fixedWidthTotal = tableColumnsRaw.reduce((acc, c) => acc + (c.width || 0), 0)

  // 🔹找到未设置宽度的列
  const autoCols = tableColumnsRaw.filter((c) => c.width == null)
  const remainingWidth = Math.max(0, stageWidth - fixedWidthTotal)
  const autoColWidth = Math.max(minAutoColWidth, autoCols.length ? remainingWidth / autoCols.length : 0)

  // 🔹在同一个 map 阶段计算最终宽度
  const tableColumns = tableColumnsRaw.map((col) => ({
    ...col,
    width: col.width ?? autoColWidth
  }))

  // 分组统计
  const leftColumns = tableColumns.filter((c) => c.fixed === 'left')
  const rightColumns = tableColumns.filter((c) => c.fixed === 'right')
  const centerColumns = tableColumns.filter((c) => !c.fixed)

  const sumWidth = (columns: Array<CanvasTable.DimensionOption | CanvasTable.GroupOption>) =>
    columns.reduce((acc, column) => acc + (column.width || 0), 0)

  columnsInfo.leftColumns = leftColumns
  columnsInfo.centerColumns = centerColumns
  columnsInfo.rightColumns = rightColumns
  columnsInfo.leftPartWidth = sumWidth(leftColumns)
  columnsInfo.centerPartWidth = sumWidth(centerColumns)
  columnsInfo.rightPartWidth = sumWidth(rightColumns)
  columnsInfo.totalWidth = columnsInfo.leftPartWidth + columnsInfo.centerPartWidth + columnsInfo.rightPartWidth
}

/**
 * 创建合并单元格
 * @param {KonvaNodePools} pools - 对象池
 * @param {Konva.Group} bodyGroup - 主体组
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} width - 单元格宽度
 * @param {number} height - 单元格高度
 * @param {number} rowIndex - 行索引
 * @param {CanvasTable.GroupOption | CanvasTable.DimensionOption} columnOption - 列配置
 * @param {AnalyzeDataVo.ChartData} row - 行数据
 * @param {number} bodyFontSize - 字体大小
 */
const drawMergedCell = (
  pools: KonvaNodePools,
  bodyGroup: Konva.Group,
  x: number,
  y: number,
  width: number,
  height: number,
  rowIndex: number,
  columnOption: CanvasTable.GroupOption | CanvasTable.DimensionOption
) => {
  const row = tableData.value[rowIndex]
  // 绘制合并单元格背景
  drawUnifiedRect({
    pools,
    name: 'merged-cell-rect',
    x,
    y,
    width: width,
    height: height,
    fill: rowIndex % 2 === 0 ? staticParams.bodyBackgroundOdd : staticParams.bodyBackgroundEven,
    stroke: staticParams.borderColor,
    strokeWidth: 1,
    group: bodyGroup
  })

  // 绘制合并单元格文本
  const value = getCellDisplayContent(columnOption, row, rowIndex)
  const maxTextWidth = calculateTextWidth.forBodyCell(columnOption)
  const truncatedValue = truncateText(value, maxTextWidth, staticParams.bodyFontSize, staticParams.bodyFontFamily)

  drawUnifiedText({
    pools,
    name: 'merged-cell-text',
    text: truncatedValue,
    x,
    y,
    fontSize: staticParams.bodyFontSize,
    fontFamily: staticParams.bodyFontFamily,
    fill: staticParams.bodyTextColor,
    align: columnOption.align ?? 'left',
    verticalAlign: columnOption.verticalAlign ?? 'middle',
    height: height,
    width: width,
    group: bodyGroup
  })
}

/**
 * 创建普通单元格
 * @param {KonvaNodePools} pools - 对象池
 * @param {Konva.Group} bodyGroup - 主体组
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} width - 单元格宽度
 * @param {number} height - 单元格高度
 * @param {number} rowIndex - 行索引
 * @param {CanvasTable.GroupOption | CanvasTable.DimensionOption} columnOption - 列配置
 * @param {AnalyzeDataVo.ChartData} row - 行数据
 * @param {number} bodyFontSize - 字体大小
 */
const drawNormalCell = (
  pools: KonvaNodePools,
  bodyGroup: Konva.Group,
  x: number,
  y: number,
  width: number,
  height: number,
  rowIndex: number,
  columnOption: CanvasTable.GroupOption | CanvasTable.DimensionOption
) => {
  const row: AnalyzeDataVo.ChartData = tableData.value[rowIndex]
  // 绘制单元格背景
  const cellRect = drawUnifiedRect({
    pools,
    name: 'cell-rect',
    x,
    y,
    width: width,
    height: height,
    fill: rowIndex % 2 === 0 ? staticParams.bodyBackgroundOdd : staticParams.bodyBackgroundEven,
    stroke: staticParams.borderColor,
    strokeWidth: 1,
    group: bodyGroup
  })
  if (columnOption.editable) {
    cellRect.on('click', (event: KonvaEventObject<MouseEvent, Konva.Rect>) => {
      cellEditorRef.value?.openEditor(
        event,
        columnOption.editType!,
        row[columnOption.columnName] as string | number,
        columnOption.editOptions
      )
    })
  }

  // 绘制单元格文本
  const value = getCellDisplayContent(columnOption, row, rowIndex)
  const maxTextWidth = calculateTextWidth.forBodyCell(columnOption)
  const truncatedValue = truncateText(value, maxTextWidth, staticParams.bodyFontSize, staticParams.bodyFontFamily)
  drawUnifiedText({
    pools,
    name: 'cell-text',
    text: truncatedValue,
    x,
    y,
    height: height,
    width: width,
    fontSize: staticParams.bodyFontSize,
    fontFamily: staticParams.bodyFontFamily,
    fill: staticParams.bodyTextColor,
    align: columnOption.align ?? 'left',
    verticalAlign: columnOption.verticalAlign ?? 'middle',
    group: bodyGroup
  })
}

/**
 * 计算单元格合并信息
 * @param {Function} spanMethod - 合并方法
 * @param {AnalyzeDataVo.ChartData} row - 行数据
 * @param {CanvasTable.GroupOption | CanvasTable.DimensionOption} columnOption - 列配置
 * @param {number} rowIndex - 行索引
 * @returns {Object} 合并信息
 */
export const calculateCellSpan = (
  spanMethod: Function,
  row: AnalyzeDataVo.ChartData,
  columnOption: CanvasTable.GroupOption | CanvasTable.DimensionOption,
  rowIndex: number
) => {
  const spanMethodResult = spanMethod({ row, column: columnOption, rowIndex, colIndex: columnOption.colIndex || 0 })
  let spanRow = 1
  let spanCol = 1
  if (Array.isArray(spanMethodResult)) {
    spanRow = Math.max(0, Number(spanMethodResult[0]) || 0)
    spanCol = Math.max(0, Number(spanMethodResult[1]) || 0)
  } else if (spanMethodResult && typeof spanMethodResult === 'object') {
    spanRow = Math.max(0, Number(spanMethodResult.rowspan) || 0)
    spanCol = Math.max(0, Number(spanMethodResult.colspan) || 0)
  }

  // 只要任一维度为 0，即视为被合并覆盖（与常见表格合并语义一致）
  const coveredBySpanMethod = spanRow === 0 || spanCol === 0

  return { spanRow, spanCol, coveredBySpanMethod }
}

/**
 * 计算合并单元格的总宽度
 * @param {number} spanCol - 跨列数
 * @param {number} colIndex - 列索引
 * @param {Array<CanvasTable.GroupOption | CanvasTable.DimensionOption>} bodyCols - 列配置数组
 * @param {number} columnWidth - 列宽度
 * @returns {number} 合并单元格总宽度
 */
export const calculateMergedCellWidth = (
  spanCol: number,
  colIndex: number,
  bodyCols: Array<CanvasTable.GroupOption | CanvasTable.DimensionOption>,
  columnWidth: number
) => {
  if (spanCol <= 1) return columnWidth

  let totalWidth = 0
  for (let i = 0; i < spanCol && colIndex + i < bodyCols.length; i++) {
    const colInfo = bodyCols[colIndex + i]
    totalWidth += colInfo.width || 0
  }
  return totalWidth
}

/**
 * 画body区域 只渲染可视区域的行
 * @param {Konva.Group | null} bodyGroup - 分组
 * @param {Array<CanvasTable.GroupOption | CanvasTable.DimensionOption>} bodyCols - 列
 * @param {KonvaNodePools} pools - 对象池
 * @returns {void}
 */
export const drawBodyPart = (
  bodyGroup: Konva.Group | null,
  bodyCols: Array<CanvasTable.GroupOption | CanvasTable.DimensionOption>,
  pools: KonvaNodePools
) => {
  if (!stageVars.stage || !bodyGroup) return

  const spanMethod = typeof staticParams.spanMethod === 'function' ? staticParams.spanMethod : null
  const hasSpanMethod = !!spanMethod

  // 清理旧节点
  recoverKonvaNode(bodyGroup, pools)

  // 渲染可视区域的行
  for (let rowIndex = bodyVars.visibleRowStart; rowIndex <= bodyVars.visibleRowEnd; rowIndex++) {
    const y = rowIndex * staticParams.bodyRowHeight
    const row = tableData.value[rowIndex]
    let x = 0

    // 渲染一行的所有列
    for (let colIndex = 0; colIndex < bodyCols.length; colIndex++) {
      const columnOption = bodyCols[colIndex]
      const columnWidth = columnOption.width || 0

      if (columnWidth <= 0) {
        x += columnWidth
        continue
      }

      // 计算合并单元格信息
      let spanRow = 1
      let spanCol = 1
      let coveredBySpanMethod = false

      if (hasSpanMethod && spanMethod) {
        const spanInfo = calculateCellSpan(spanMethod, row, columnOption, rowIndex)
        spanRow = spanInfo.spanRow
        spanCol = spanInfo.spanCol
        coveredBySpanMethod = spanInfo.coveredBySpanMethod
      }

      // 如果被合并覆盖，跳过绘制
      if (hasSpanMethod && coveredBySpanMethod) {
        x += columnWidth
        continue
      }

      const computedRowSpan = hasSpanMethod ? spanRow : 1
      const height = computedRowSpan * staticParams.bodyRowHeight
      const width = calculateMergedCellWidth(spanCol, colIndex, bodyCols, columnWidth)

      // 绘制单元格
      if (hasSpanMethod && (computedRowSpan > 1 || spanCol > 1)) {
        drawMergedCell(pools, bodyGroup, x, y, width, height, rowIndex, columnOption)
      } else {
        drawNormalCell(pools, bodyGroup, x, y, width, height, rowIndex, columnOption)
      }

      // 计算下一个位置和跳过的列数
      if (hasSpanMethod && spanCol > 1) {
        colIndex += spanCol - 1
        x += width
      } else {
        x += columnWidth
      }
    }
  }

  // 渲染完成后，若存在点击高亮，保持其在最顶层
  if (bodyVars.highlightRect) {
    bodyVars.highlightRect.moveToTop()
  }
}
