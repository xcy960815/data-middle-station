import { Chart } from '@antv/g2'
import { useSendChartEmail } from './useSendChartEmail'

// 定义 G2 v5 Chart 实例的正确类型
export type G2ChartInstance = InstanceType<typeof Chart>

/**
 * 图表导出相关组合式函数
 * 用于抽离各个图表组件中重复的导出逻辑
 */
export const useChartExport = (chartInstance: Ref<G2ChartInstance> | null) => {
  // 图表导出功能
  const { exportChartAsBase64, downloadChartAsImage } = useSendChartEmail()

  /**
   * 导出图表为 Base64
   * @param options 导出配置选项
   * @returns Promise<string> Base64 图像数据
   */
  const exportAsImage = async (options?: SendEmailDto.ExportChartConfigs): Promise<string> => {
    if (!chartInstance?.value) {
      throw new Error('图表实例不存在')
    }
    return exportChartAsBase64(chartInstance.value, options)
  }

  /**
   * 下载图表
   * @param filename 文件名
   * @param options 导出配置选项
   */
  const downloadChart = async (filename: string, options?: SendEmailDto.ExportChartConfigs) => {
    if (!chartInstance?.value) {
      throw new Error('图表实例不存在')
    }
    return downloadChartAsImage(chartInstance.value, filename, options)
  }

  /**
   * 获取图表导出相关的 defineExpose 对象
   * 返回一个对象，包含图表实例和导出方法，可以直接用于 defineExpose
   */
  const getChartExpose = () => ({
    chartInstance,
    exportAsImage,
    downloadChart
  })

  return {
    exportAsImage,
    downloadChart,
    getChartExpose
  }
}
