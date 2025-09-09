import type { Chart } from '@antv/g2'
import html2canvas from 'html2canvas'

// 定义 G2 v5 Chart 实例的正确类型
type G2ChartInstance = InstanceType<typeof Chart>

/**
 * 图表导出工具类
 */
export class ChartExporter {
  /**
   * 将 G2 图表导出为 Base64 图片（使用 html2canvas）
   * @param chartInstance G2 图表实例
   * @param options 导出选项
   * @returns Promise<string> Base64 格式的图片数据
   */
  static async exportChartAsBase64(
    chartInstance: G2ChartInstance | null,
    options: {
      type?: 'image/png' | 'image/jpeg'
      quality?: number
      width?: number
      height?: number
      backgroundColor?: string
    } = {}
  ): Promise<string> {
    const { type = 'image/png', quality = 1, backgroundColor = '#ffffff' } = options

    try {
      // 等待图表渲染完成
      await chartInstance?.render()

      // 获取图表容器
      const container = chartInstance?.getContainer()
      if (!container) {
        throw new Error('无法找到图表容器')
      }

      // 使用 html2canvas 截图
      const canvas = await html2canvas(container as HTMLElement, {
        backgroundColor,
        scale: 1,
        logging: false,
        useCORS: true,
        allowTaint: false,
        width: options.width,
        height: options.height
      })

      // 如果指定了自定义尺寸且与实际尺寸不同，则进行缩放
      if ((options.width && options.width !== canvas.width) || (options.height && options.height !== canvas.height)) {
        const newCanvas = document.createElement('canvas')
        const ctx = newCanvas.getContext('2d')!

        const targetWidth = options.width || canvas.width
        const targetHeight = options.height || canvas.height

        newCanvas.width = targetWidth
        newCanvas.height = targetHeight

        // 绘制缩放后的图表
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetWidth, targetHeight)

        return newCanvas.toDataURL(type, quality)
      }

      // 直接导出
      return canvas.toDataURL(type, quality)
    } catch (error) {
      console.error('图表导出失败:', error)
      throw new Error(`图表导出失败: ${error}`)
    }
  }

  /**
   * 将 G2 图表导出为 Buffer（用于服务端）
   * @param chartInstance G2 图表实例
   * @param options 导出选项
   * @returns Promise<Buffer> 图片 Buffer 数据
   */
  static async exportChartAsBuffer(
    chartInstance: G2ChartInstance | null,
    options: {
      type?: 'image/png' | 'image/jpeg'
      quality?: number
      width?: number
      height?: number
      backgroundColor?: string
    } = {}
  ): Promise<Buffer> {
    const base64Data = await this.exportChartAsBase64(chartInstance, options)

    // 移除 data:image/png;base64, 前缀
    const base64WithoutPrefix = base64Data.replace(/^data:image\/[a-z]+;base64,/, '')

    return Buffer.from(base64WithoutPrefix, 'base64')
  }

  /**
   * 下载图表为图片文件
   * @param chartInstance G2 图表实例
   * @param filename 文件名（不包含扩展名）
   * @param options 导出选项
   */
  static async downloadChart(
    chartInstance: G2ChartInstance | null,
    filename: string,
    options: {
      type?: 'image/png' | 'image/jpeg'
      quality?: number
      width?: number
      height?: number
      backgroundColor?: string
    } = {}
  ): Promise<void> {
    const { type = 'image/png' } = options
    const base64Data = await this.exportChartAsBase64(chartInstance, options)

    // 创建下载链接
    const link = document.createElement('a')
    link.href = base64Data
    link.download = `${filename}.${type.split('/')[1]}`

    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * 通过 DOM 元素导出图片（使用 html2canvas）
   * @param element DOM 元素
   * @param options 导出选项
   * @returns Promise<string> Base64 格式的图片数据
   */
  static async exportElementAsBase64(
    element: HTMLElement,
    options: {
      type?: 'image/png' | 'image/jpeg'
      quality?: number
      width?: number
      height?: number
      backgroundColor?: string
      scale?: number
    } = {}
  ): Promise<string> {
    const { type = 'image/png', quality = 1, backgroundColor = '#ffffff', scale = 1 } = options

    try {
      // 使用 html2canvas 截图
      const canvas = await html2canvas(element, {
        backgroundColor,
        scale,
        logging: false,
        useCORS: true,
        allowTaint: false,
        width: options.width,
        height: options.height
      })

      // 如果指定了自定义尺寸且与实际尺寸不同，则进行缩放
      if ((options.width && options.width !== canvas.width) || (options.height && options.height !== canvas.height)) {
        const newCanvas = document.createElement('canvas')
        const ctx = newCanvas.getContext('2d')!

        const targetWidth = options.width || canvas.width
        const targetHeight = options.height || canvas.height

        newCanvas.width = targetWidth
        newCanvas.height = targetHeight

        // 绘制缩放后的图表
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetWidth, targetHeight)

        return newCanvas.toDataURL(type, quality)
      }

      // 直接导出
      return canvas.toDataURL(type, quality)
    } catch (error) {
      console.error('元素导出失败:', error)
      throw new Error(`元素导出失败: ${error}`)
    }
  }

  /**
   * 获取图表容器的精确尺寸
   * @param containerId 图表容器ID
   * @returns 容器尺寸信息
   */
  static getContainerSize(containerId: string): { width: number; height: number } {
    const container = document.getElementById(containerId)
    if (!container) {
      throw new Error(`找不到容器: ${containerId}`)
    }

    const rect = container.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height
    }
  }
}

/**
 * 图表邮件导出接口
 */
export interface ChartEmailExportData {
  chartId: string
  title: string
  base64Image: string
  filename: string
}

/**
 * 批量导出多个图表用于邮件发送
 * @param charts 图表实例数组
 * @returns Promise<ChartEmailExportData[]>
 */
export async function exportChartsForEmail(
  charts: Array<{
    instance: G2ChartInstance | null
    title: string
    filename: string
  }>
): Promise<ChartEmailExportData[]> {
  const results: ChartEmailExportData[] = []

  for (let i = 0; i < charts.length; i++) {
    const { instance, title, filename } = charts[i]

    try {
      const base64Image = await ChartExporter.exportChartAsBase64(instance, {
        type: 'image/png',
        quality: 1
      })

      results.push({
        chartId: `chart_${i}`,
        title,
        base64Image,
        filename
      })
    } catch (error) {
      console.error(`导出图表 ${title} 失败:`, error)
      // 可以选择跳过失败的图表或抛出错误
    }
  }

  return results
}
