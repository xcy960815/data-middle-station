// 导出所有接口和类型
export type { ChartDataProcessResult, ChartRenderConfig, ChartRenderer } from './utils'

// 导出工具函数（用于直接导入）
export { foldData, formatValue, getDefaultChartColors, processChartData, sortXAxisData } from './utils'

// 导入渲染函数和工具函数
import { renderIntervalChart as _renderIntervalChart } from './renderIntervalChart'
import { renderLineChart as _renderLineChart } from './renderLineChart'
import { renderPieChart as _renderPieChart } from './renderPieChart'
import {
  foldData as _foldData,
  formatValue as _formatValue,
  getDefaultChartColors as _getDefaultChartColors,
  processChartData as _processChartData,
  sortXAxisData as _sortXAxisData
} from './utils'

/**
 * 图表渲染功能的 composable
 */
export const useChartRender = () => {
  return {
    // 图表渲染函数
    renderIntervalChart: _renderIntervalChart,
    renderLineChart: _renderLineChart,
    renderPieChart: _renderPieChart,
    // 工具函数
    foldData: _foldData,
    formatValue: _formatValue,
    getDefaultChartColors: _getDefaultChartColors,
    processChartData: _processChartData,
    sortXAxisData: _sortXAxisData
  }
}
