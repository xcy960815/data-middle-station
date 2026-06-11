// 导出所有接口和类型
export type { ChartType } from './emptyChartOption'
export type { ChartDataProcessResult, ChartRenderConfig, ChartRenderer } from './utils'

// 导入渲染函数和工具函数
import { createEmptyChartOption as _createEmptyChartOption } from './emptyChartOption'
import { renderAreaChart as _renderAreaChart } from './renderAreaChart'
import { renderComboChart as _renderComboChart } from './renderComboChart'
import { renderFunnelChart as _renderFunnelChart } from './renderFunnelChart'
import { renderIntervalChart as _renderIntervalChart } from './renderIntervalChart'
import { renderLineChart as _renderLineChart } from './renderLineChart'
import { renderPieChart as _renderPieChart } from './renderPieChart'
import { renderScatterChart as _renderScatterChart } from './renderScatterChart'
import { renderStackedChart as _renderStackedChart } from './renderStackedChart'
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
    renderComboChart: _renderComboChart,
    renderStackedChart: _renderStackedChart,
    renderAreaChart: _renderAreaChart,
    renderFunnelChart: _renderFunnelChart,
    renderScatterChart: _renderScatterChart,
    // 工具函数
    foldData: _foldData,
    formatValue: _formatValue,
    getDefaultChartColors: _getDefaultChartColors,
    processChartData: _processChartData,
    sortXAxisData: _sortXAxisData,
    // 空图表配置
    createEmptyChartOption: _createEmptyChartOption
  }
}
