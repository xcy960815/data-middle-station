import type { Chart } from '@antv/g2'
import html2canvas from 'html2canvas'
import type { EmailFormData } from '~/pages/analyse/components/bar/components/send-email-dialog.vue'

// 定义 G2 v5 Chart 实例的正确类型
type G2ChartInstance = InstanceType<typeof Chart>

/**
 * 图表组件引用接口
 * 定义图表组件必须提供的导出方法
 */
export interface ChartComponentRef {
  exportAsImage: (options?: SendEmailDto.ExportChartConfigs) => Promise<string>
  downloadChart: (filename: string, options?: SendEmailDto.ExportChartConfigs) => Promise<void>
}

/**
 * 图表邮件发送组合式函数
 */
export function useSendChartEmail() {
  /**
   * 将 G2 图表导出为 Base64 图片（使用 html2canvas）
   * @param chartInstance G2 图表实例
   * @param options 导出选项
   * @returns Promise<string> Base64 格式的图片数据
   */
  const exportChartAsBase64 = async (
    chartInstance: G2ChartInstance | null,
    options: SendEmailDto.ExportChartConfigs = {}
  ): Promise<string> => {
    const { type = 'image/png', quality = 1, backgroundColor = '#ffffff', scale = 1 } = options

    try {
      // 获取图表容器
      const container = chartInstance?.getContainer()
      if (!container) {
        throw new Error('无法找到图表容器')
      }

      // 使用 html2canvas 截图
      const canvas = await html2canvas(container, {
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
      console.error('图表导出失败:', error)
      throw new Error(`图表导出失败: ${error}`)
    }
  }

  /**
   * 通过 DOM 元素导出图片（使用 html2canvas）
   * @param element DOM 元素
   * @param options 导出选项
   * @returns Promise<string> Base64 格式的图片数据
   */
  const exportElementAsBase64 = async (
    element: HTMLElement,
    options: SendEmailDto.ExportChartConfigs = {}
  ): Promise<string> => {
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
   * 将 G2 图表导出为 Buffer（用于服务端）
   * @param chartInstance G2 图表实例
   * @param options 导出选项
   * @returns Promise<Buffer> 图片 Buffer 数据
   */
  const exportChartAsBuffer = async (
    chartInstance: G2ChartInstance | null,
    options: SendEmailDto.ExportChartConfigs = {}
  ): Promise<Buffer> => {
    const base64Data = await exportChartAsBase64(chartInstance, options)

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
  const downloadChartAsImage = async (
    chartInstance: G2ChartInstance | null,
    filename: string,
    options: SendEmailDto.ExportChartConfigs = {}
  ): Promise<void> => {
    const { type = 'image/png' } = options
    const base64Data = await exportChartAsBase64(chartInstance, options)

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
   * 获取图表容器的精确尺寸
   * @param containerId 图表容器ID
   * @returns 容器尺寸信息
   */
  const getContainerSize = (containerId: string): { width: number; height: number } => {
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

  /**
   * 从图表组件引用中导出图表
   * @param chartRef 图表组件引用
   * @param title 图表标题
   * @param filename 文件名（可选）
   * @returns Promise<ChartEmailExportData>
   */
  const exportChartsFromRef = async (
    chartRef: ChartComponentRef | null,
    title: string,
    filename?: string
  ): Promise<SendEmailDto.ChartEmailExportData> => {
    if (!chartRef) {
      throw new Error('图表引用不存在')
    }
    try {
      const base64Image = await chartRef.exportAsImage({
        type: 'image/png',
        quality: 1
      })

      return {
        chartId: 'chart_0',
        title,
        base64Image,
        filename: filename || 'chart'
      }
    } catch (error) {
      console.error(`导出图表 ${title} 失败:`, error)

      // 根据错误类型提供更具体的错误信息
      const errorStr = String(error)
      let errorMessage = '图表导出失败'
      let userTip = '请稍后重试'

      if (errorStr.includes('interaction')) {
        errorMessage = '图表交互状态异常'
        userTip = '请等待图表完全加载后重试'
      } else if (errorStr.includes('容器')) {
        errorMessage = '图表容器未找到'
        userTip = '请确保图表已正确渲染'
      } else if (errorStr.includes('实例不存在')) {
        errorMessage = '图表实例不存在'
        userTip = '请刷新页面后重试'
      } else if (errorStr.includes('DOM')) {
        errorMessage = '图表DOM结构异常'
        userTip = '请稍后重试'
      } else if (errorStr.includes('Cannot read properties of undefined')) {
        errorMessage = '图表内部状态异常'
        userTip = '请等待图表加载完成后重试'
      } else if (errorStr.includes('html2canvas')) {
        errorMessage = '图表截图失败'
        userTip = '请检查浏览器设置或稍后重试'
      }

      // 抛出包含具体信息和用户提示的错误
      throw new Error(`${errorMessage}，${userTip}`)
    }
  }

  /**
   * 发送图表邮件
   * @param chart 图表数据
   * @param emailOptions 邮件选项
   * @returns Promise<Object>
   */
  const sendChartEmail = async (chart: SendEmailDto.ChartEmailExportData, emailOptions: EmailFormData) => {
    if (!chart) {
      throw new Error('没有可发送的图表')
    }

    const response = await $fetch('/api/sendChartEmail', {
      method: 'POST',
      body: {
        to: emailOptions.to,
        subject: emailOptions.subject,
        additionalContent: emailOptions.additionalContent,
        chart: {
          id: chart.chartId,
          title: chart.title,
          base64Image: chart.base64Image,
          filename: chart.filename
        }
      }
    })

    return response
  }

  /**
   * 从图表组件直接发送邮件（一键操作）
   * @param chartRef 图表组件引用
   * @param title 图表标题
   * @param emailOptions 邮件选项
   * @param filename 文件名（可选）
   * @returns Promise<Object>
   */
  const sendEmailFromChartRef = async (
    chartRef: ChartComponentRef | null,
    title: string,
    emailOptions: EmailFormData,
    filename?: string
  ) => {
    // 1. 导出图表
    const chart = await exportChartsFromRef(chartRef, title, filename)

    // 2. 发送邮件
    return sendChartEmail(chart, emailOptions)
  }

  /**
   * 下载单个图表
   * @param chartRef 图表组件引用
   * @param filename 文件名
   * @returns Promise<void>
   */
  const downloadChart = async (chartRef: ChartComponentRef | null, filename: string): Promise<void> => {
    if (!chartRef) {
      throw new Error('图表引用不存在')
    }

    try {
      await chartRef.downloadChart(filename, {
        type: 'image/png',
        quality: 1
      })
    } catch (error) {
      console.error(`下载图表 ${filename} 失败:`, error)
      throw error
    }
  }

  /**
   * 验证邮件地址格式
   * @param email 邮件地址
   * @returns boolean
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * 验证邮件地址数组
   * @param emails 邮件地址数组
   * @returns { valid: boolean; invalidEmails: string[] }
   */
  const validateEmails = (emails: string | string[]): { valid: boolean; invalidEmails: string[] } => {
    const emailArray = Array.isArray(emails) ? emails : [emails]
    const invalidEmails = emailArray.filter((email) => !validateEmail(email.trim()))

    return {
      valid: invalidEmails.length === 0,
      invalidEmails
    }
  }

  return {
    // 图表导出相关
    exportChartAsBase64,
    exportChartAsBuffer,
    exportElementAsBase64,
    downloadChartAsImage,
    getContainerSize,
    // 邮件发送相关
    exportChartsFromRef,
    sendChartEmail,
    sendEmailFromChartRef,
    downloadChart,
    // 工具函数
    validateEmail,
    validateEmails
  }
}
