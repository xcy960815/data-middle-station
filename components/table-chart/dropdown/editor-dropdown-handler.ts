import { chartProps } from '../props'
import { getTableContainerElement } from '../utils'
import type { Prettify } from '../variable'
import { tableVars } from '../variable'

interface EditorDropdownHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
  tableData: Array<ChartDataVo.ChartData>
}

export const editorDropdownHandler = ({ props, tableData }: EditorDropdownHandlerProps) => {
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
    // 设置编辑器状态
    cellEditorDropdown.editingCell = {
      rowIndex,
      colIndex,
      colKey: column.columnName,
      column
    }
    cellEditorDropdown.editType = column.editType || 'input'
    cellEditorDropdown.editOptions = column.editOptions || []
    cellEditorDropdown.initialValue = String(tableData[rowIndex][column.columnName] ?? '')
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

  onMounted(() => {
    window.addEventListener('scroll', updateCellEditorPositionsInPage)
    window.addEventListener('scroll', updateCellEditorPositionsInPage)
  })
  onUnmounted(() => {
    window.removeEventListener('scroll', updateCellEditorPositionsInPage)
    window.removeEventListener('scroll', updateCellEditorPositionsInPage)
  })
  return {
    cellEditorDropdown,
    openCellEditorDropdown,
    closeCellEditorDropdown,
    resetCellEditorDropdown,
    updateCellEditorPositionsInTable
  }
}
