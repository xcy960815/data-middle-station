import { reactive } from 'vue'
import type { CanvasTableEmits } from '../emits'
import { chartProps } from '../props'
import { getTableContainerElement } from '../utils'
import type { Prettify } from '../variable-handlder'
import { variableHandlder } from '../variable-handlder'

interface EditorDropdownHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
  emits?: <T extends keyof CanvasTableEmits>(event: T, ...args: CanvasTableEmits[T]) => void
}

/**
 * 单元格编辑器状态
 */
const cellEditorDropdown = reactive({
  visible: false,
  editType: 'input' as 'input' | 'select' | 'date' | 'datetime',
  editOptions: [] as Array<{ label: string; value: string | number }>,
  initialValue: '',
  position: {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  },
  // 当前编辑的单元格信息
  editingCell: {
    rowIndex: -1,
    colIndex: -1,
    colKey: '',
    column: null as GroupStore.GroupOption | DimensionStore.DimensionOption | null
  }
})

export const editorDropdownHandler = ({ props, emits }: EditorDropdownHandlerProps) => {
  const { tableData, tableVars } = variableHandlder({ props })
  /**
   * 清空 Konva 节点
   */
  const clearLayersForRebuild = () => {
    tableVars.headerLayer?.destroyChildren()
    tableVars.bodyLayer?.destroyChildren()
    tableVars.summaryLayer?.destroyChildren()
    tableVars.fixedHeaderLayer?.destroyChildren()
    tableVars.fixedBodyLayer?.destroyChildren()
    tableVars.fixedSummaryLayer?.destroyChildren()
    tableVars.scrollbarLayer?.destroyChildren()
    tableVars.verticalScrollbarGroup = null
    tableVars.horizontalScrollbarGroup = null
    tableVars.verticalScrollbarThumbRect = null
    tableVars.horizontalScrollbarThumbRect = null
    tableVars.centerBodyClipGroup = null
    tableVars.highlightRect = null
    tableVars.visibleRowStart = 0
    tableVars.visibleRowEnd = 0
    tableVars.visibleRowCount = 0
    tableVars.leftSummaryGroup = null
    tableVars.centerSummaryGroup = null
    tableVars.rightSummaryGroup = null
    tableVars.hoveredRowIndex = null
    tableVars.hoveredColIndex = null
  }

  /**
   *
   */
  const openCellEditorDropdown = (
    rowIndex: number,
    colIndex: number,
    column: GroupStore.GroupOption | DimensionStore.DimensionOption,
    cellX: number,
    cellY: number,
    cellWidth: number,
    cellHeight: number
  ) => {
    const tableContainer = getTableContainerElement()
    if (!tableContainer) return
    const tableContainerRect = tableContainer.getBoundingClientRect()
    const offsetX = tableContainerRect.left
    const offsetY = tableContainerRect.top

    // 计算编辑器的绝对位置（相对于视口）
    const editorX = offsetX + cellX - tableVars.stageScrollX
    const editorY = offsetY + cellY + props.headerHeight - tableVars.stageScrollY

    // 获取当前行数据
    const currentRowData = tableData.value[rowIndex]
    if (!currentRowData) return

    // 设置编辑器状态
    cellEditorDropdown.editingCell = {
      rowIndex,
      colIndex,
      colKey: column.columnName,
      column
    }
    cellEditorDropdown.editType = column.editType || 'input'
    cellEditorDropdown.editOptions = column.editOptions || []
    cellEditorDropdown.initialValue = String(currentRowData[column.columnName] ?? '')
    cellEditorDropdown.position = {
      x: editorX,
      y: editorY,
      width: cellWidth,
      height: cellHeight
    }
    cellEditorDropdown.visible = true
  }

  /**
   * 更新编辑器位置（当表格滚动时调用）
   */
  const updateCellEditorPositionsInTable = () => {
    if (cellEditorDropdown.visible) {
      resetCellEditorDropdown()
      return
    }
  }

  /**
   * 更新编辑器位置（当页面滚动时调用）
   */
  const updateCellEditorPositionsInPage = () => {
    if (cellEditorDropdown.visible) {
      resetCellEditorDropdown()
      return
    }
  }

  /**
   * 取消单元格编辑
   */
  const closeCellEditorDropdown = () => {
    resetCellEditorDropdown()
  }
  /**
   * 保存单元格编辑
   */
  const handleCellEditorSave = (newValue: string | number) => {
    const { rowIndex, colKey, column } = cellEditorDropdown.editingCell
    if (rowIndex >= 0 && colKey && column) {
      const rowData = tableData.value[rowIndex]
      rowData[colKey] = newValue
      if (emits) {
        emits('cell-edit', { rowIndex, colKey, rowData })
      }
      clearLayersForRebuild()
      tableVars.rebuildGroupsFn && tableVars.rebuildGroupsFn()
    }
    resetCellEditorDropdown()
  }
  /**
   * 重置编辑器状态
   */
  const resetCellEditorDropdown = () => {
    cellEditorDropdown.visible = false
    cellEditorDropdown.editingCell = {
      rowIndex: -1,
      colIndex: -1,
      colKey: '',
      column: null
    }
    cellEditorDropdown.initialValue = ''
    cellEditorDropdown.editOptions = []
  }

  /**
   * 初始化事件监听器
   */
  const initCellEditorListeners = () => {
    window.addEventListener('scroll', updateCellEditorPositionsInPage)
    document.addEventListener('scroll', updateCellEditorPositionsInPage)
  }

  /**
   * 清理事件监听器
   */
  const cleanupCellEditorListeners = () => {
    window.removeEventListener('scroll', updateCellEditorPositionsInPage)
    document.removeEventListener('scroll', updateCellEditorPositionsInPage)
  }
  return {
    cellEditorDropdown,
    openCellEditorDropdown,
    closeCellEditorDropdown,
    resetCellEditorDropdown,
    updateCellEditorPositionsInTable,
    handleCellEditorSave,
    initCellEditorListeners,
    cleanupCellEditorListeners
  }
}
