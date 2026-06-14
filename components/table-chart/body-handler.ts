import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import CellEditor from './components/cell-editor.vue'
import { bindCurrentTableContext, getTableParams, getProcessedRows, getRuntimeState } from './parameter'
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

import type { BodyState, ColumnsInfo } from './runtime-state'
import type { KonvaNodePools } from './utils'

export const bodyVars = new Proxy({} as BodyState, {
  get: (_target, property: keyof BodyState) => getRuntimeState().body[property],
  set: (_target, property: keyof BodyState, value) => {
    getRuntimeState().body[property] = value as never
    return true
  }
})

export const columnsInfo = new Proxy({} as ColumnsInfo, {
  get: (_target, property: keyof ColumnsInfo) => getRuntimeState().columns[property],
  set: (_target, property: keyof ColumnsInfo, value) => {
    getRuntimeState().columns[property] = value as never
    return true
  }
})

/**
 * 单元格编辑器组件引用
 */
export const cellEditorRef = new Proxy({} as { value: InstanceType<typeof CellEditor> | null }, {
  get: (_target, property: 'value') => getRuntimeState().cellEditorRef[property],
  set: (_target, property: 'value', value) => {
    getRuntimeState().cellEditorRef[property] = value
    return true
  }
})

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
 * 计算可视区域行数
 * @returns {void}
 */
export const calculateVisibleRows = () => {
  if (!stageVars.stage) return

  const { height: stageHeight } = getStageSize()

  const bodyHeight = stageHeight - getTableParams().headerRowHeight - getSummaryRowHeight()

  // 计算可视区域能显示的行数
  bodyVars.visibleRowCount = Math.ceil(bodyHeight / getTableParams().bodyRowHeight)

  // 根据scrollY计算起始行
  const startRow = Math.floor(scrollbarVars.stageScrollY / getTableParams().bodyRowHeight)

  // 算上缓冲条数的开始下标+结束下标
  bodyVars.visibleRowStart = Math.max(0, startRow - getTableParams().bufferRows)

  bodyVars.visibleRowEnd = Math.min(
    getProcessedRows().value.length - 1,
    startRow + bodyVars.visibleRowCount + getTableParams().bufferRows
  )
}

export const resetColumnsInfo = () => {
  columnsInfo.leftColumns = []
  columnsInfo.centerColumns = []
  columnsInfo.rightColumns = []
  columnsInfo.leftPartWidth = 0
  columnsInfo.centerPartWidth = 0
  columnsInfo.rightPartWidth = 0
  columnsInfo.totalWidth = 0
}

export const resetBodyState = () => {
  bodyVars.leftBodyPools.cellRects = []
  bodyVars.leftBodyPools.cellTexts = []
  bodyVars.centerBodyPools.cellRects = []
  bodyVars.centerBodyPools.cellTexts = []
  bodyVars.rightBodyPools.cellRects = []
  bodyVars.rightBodyPools.cellTexts = []
  bodyVars.bodyLayer = null
  bodyVars.fixedBodyLayer = null
  bodyVars.leftBodyGroup = null
  bodyVars.centerBodyGroup = null
  bodyVars.rightBodyGroup = null
  bodyVars.highlightRect = null
  bodyVars.visibleRowStart = 0
  bodyVars.visibleRowEnd = 0
  bodyVars.visibleRowCount = 0
  cellEditorRef.value = null
  resetColumnsInfo()
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
  const { width: stageWidthRaw } = getStageSize()
  const { xAxisFields, yAxisFields, bodyRowHeight, minAutoColWidth } = getTableParams()

  // 可用宽度（由于使用了原生滚动条，代理层的 clientWidth 已自然减去了滚动条的宽度，无需再次手动扣除）
  const stageWidth = stageWidthRaw

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

  const sumWidth = (columns: CanvasTable.ColumnOption[]) =>
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
 * 为可编辑单元格绑定双击打开编辑器
 */
const bindEditableCell = (cellRect: Konva.Rect, rowIndex: number, columnOption: CanvasTable.ColumnOption) => {
  if (!columnOption.editable) return

  cellRect.on(
    'dblclick',
    bindCurrentTableContext((event: KonvaEventObject<MouseEvent, Konva.Rect>) => {
      const row = getProcessedRows().value[rowIndex]
      cellEditorRef.value?.openEditor(
        event,
        columnOption.editType!,
        row[columnOption.columnName] as string | number,
        columnOption.editOptions,
        {
          align: columnOption.align ?? 'left',
          fontSize: getTableParams().bodyFontSize,
          fontFamily: getTableParams().bodyFontFamily,
          padding: getTableParams().textPaddingHorizontal
        },
        {
          row,
          columnName: columnOption.columnName,
          columnType: columnOption.columnType
        }
      )
    })
  )
}

const drawMergedCell = (
  pools: KonvaNodePools,
  bodyGroup: Konva.Group,
  x: number,
  y: number,
  width: number,
  height: number,
  rowIndex: number,
  columnOption: CanvasTable.ColumnOption
) => {
  const row = getProcessedRows().value[rowIndex]
  // 绘制合并单元格背景
  const cellRect = drawUnifiedRect({
    pools,
    name: 'merged-cell-rect',
    x,
    y,
    width: width,
    height: height,
    fill: rowIndex % 2 === 0 ? getTableParams().bodyBackgroundOdd : getTableParams().bodyBackgroundEven,
    stroke: getTableParams().borderColor,
    strokeWidth: 1,
    listening: !!columnOption.editable,
    group: bodyGroup
  })
  bindEditableCell(cellRect, rowIndex, columnOption)

  // 绘制合并单元格文本
  const value = getCellDisplayContent(columnOption, row, rowIndex)
  const maxTextWidth = calculateTextWidth.forBodyCell(columnOption)
  const truncatedValue = truncateText(
    value,
    maxTextWidth,
    getTableParams().bodyFontSize,
    getTableParams().bodyFontFamily
  )

  drawUnifiedText({
    pools,
    name: 'merged-cell-text',
    text: truncatedValue,
    x,
    y,
    fontSize: getTableParams().bodyFontSize,
    fontFamily: getTableParams().bodyFontFamily,
    fill: getTableParams().bodyTextColor,
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
 * @param {CanvasTable.ColumnOption} columnOption - 列配置
 */
const drawNormalCell = (
  pools: KonvaNodePools,
  bodyGroup: Konva.Group,
  x: number,
  y: number,
  width: number,
  height: number,
  rowIndex: number,
  columnOption: CanvasTable.ColumnOption
) => {
  const row: AnalyzeDataVo.AnalyzeData = getProcessedRows().value[rowIndex]
  // 绘制单元格背景
  const cellRect = drawUnifiedRect({
    pools,
    name: 'cell-rect',
    x,
    y,
    width: width,
    height: height,
    fill: rowIndex % 2 === 0 ? getTableParams().bodyBackgroundOdd : getTableParams().bodyBackgroundEven,
    stroke: getTableParams().borderColor,
    strokeWidth: 1,
    listening: !!columnOption.editable,
    group: bodyGroup
  })
  bindEditableCell(cellRect, rowIndex, columnOption)

  // 绘制单元格文本
  const value = getCellDisplayContent(columnOption, row, rowIndex)
  const maxTextWidth = calculateTextWidth.forBodyCell(columnOption)
  const truncatedValue = truncateText(
    value,
    maxTextWidth,
    getTableParams().bodyFontSize,
    getTableParams().bodyFontFamily
  )
  drawUnifiedText({
    pools,
    name: 'cell-text',
    text: truncatedValue,
    x,
    y,
    height: height,
    width: width,
    fontSize: getTableParams().bodyFontSize,
    fontFamily: getTableParams().bodyFontFamily,
    fill: getTableParams().bodyTextColor,
    align: columnOption.align ?? 'left',
    verticalAlign: columnOption.verticalAlign ?? 'middle',
    group: bodyGroup
  })
}

/**
 * 计算单元格合并信息
 * @param {Function} spanMethod - 合并方法
 * @param {AnalyzeDataVo.AnalyzeData} row - 行数据
 * @param {CanvasTable.ColumnOption} columnOption - 列配置
 * @param {number} rowIndex - 行索引
 * @returns {Object} 合并信息
 */
export const calculateCellSpan = (
  spanMethod: Function,
  row: AnalyzeDataVo.AnalyzeData,
  columnOption: CanvasTable.ColumnOption,
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
 * @param {CanvasTable.ColumnOption[]} bodyCols - 列配置数组
 * @param {number} columnWidth - 列宽度
 * @returns {number} 合并单元格总宽度
 */
export const calculateMergedCellWidth = (
  spanCol: number,
  colIndex: number,
  bodyCols: CanvasTable.ColumnOption[],
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
 * @param {CanvasTable.ColumnOption[]} bodyCols - 列
 * @param {KonvaNodePools} pools - 对象池
 * @returns {void}
 */
export const drawBodyPart = (
  bodyGroup: Konva.Group | null,
  bodyCols: CanvasTable.ColumnOption[],
  pools: KonvaNodePools
) => {
  if (!stageVars.stage || !bodyGroup) return

  const spanMethod = typeof getTableParams().spanMethod === 'function' ? getTableParams().spanMethod : null
  const hasSpanMethod = !!spanMethod

  // 清理旧节点
  recoverKonvaNode(bodyGroup, pools)

  // 渲染可视区域的行
  for (let rowIndex = bodyVars.visibleRowStart; rowIndex <= bodyVars.visibleRowEnd; rowIndex++) {
    const y = rowIndex * getTableParams().bodyRowHeight
    const row = getProcessedRows().value[rowIndex]
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
      const height = computedRowSpan * getTableParams().bodyRowHeight
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
