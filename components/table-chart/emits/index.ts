// 基础表格组件的事件类型
export type CanvasTableEmits = {
  'cell-click': [{ rowIndex: number; colIndex: number; colKey: string; rowData: ChartDataVo.ChartData }]
  'action-click': [{ rowIndex: number; action: string; rowData: ChartDataVo.ChartData }]
  'cell-edit': [{ rowIndex: number; colKey: string; rowData: ChartDataVo.ChartData }]
  // 'column-width-change': [{ columnName: string; width: number; columnWidthOverrides: Record<string, number> }] // 已注释掉
  'render-chart-start': []
  'render-chart-end': []
}

// 兼容旧的导出名称
export type ChartEmits = CanvasTableEmits
