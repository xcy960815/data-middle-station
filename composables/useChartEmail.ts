import type { ChartEmailExportData } from '~/utils/chart-export'

/**
 * 图表邮件发送组合式函数
 */
export function useChartEmail() {
  /**
   * 从图表组件引用中导出图表
   * @param chartRef 图表组件引用
   * @param title 图表标题
   * @param filename 文件名（可选）
   * @returns Promise<ChartEmailExportData>
   */
  const exportChartsFromRef = async (
    chartRef: SendEmailDto.ChartComponentRef | null,
    title: string,
    filename?: string
  ): Promise<ChartEmailExportData> => {
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
      throw error
    }
  }

  /**
   * 发送图表邮件
   * @param charts 图表数据
   * @param emailOptions 邮件选项
   * @returns Promise<{ success: boolean; messageId: string; message: string }>
   */
  const sendChartEmail = async (charts: ChartEmailExportData[], emailOptions: SendEmailDto.EmailChartOptions) => {
    if (!charts || charts.length === 0) {
      throw new Error('没有可发送的图表')
    }

    const response = await $fetch('/api/sendChartEmail', {
      method: 'POST',
      body: {
        ...emailOptions,
        charts: charts.map((chart) => ({
          title: chart.title,
          base64Image: chart.base64Image,
          filename: chart.filename
        }))
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
   * @returns Promise<{ success: boolean; messageId: string; message: string }>
   */
  const sendEmailFromChartRef = async (
    chartRef: SendEmailDto.ChartComponentRef | null,
    title: string,
    emailOptions: SendEmailDto.EmailChartOptions,
    filename?: string
  ) => {
    // 1. 导出图表
    const chart = await exportChartsFromRef(chartRef, title, filename)

    // 2. 发送邮件
    return sendChartEmail([chart], emailOptions)
  }

  /**
   * 批量下载图表
   * @param chartRefs 图表组件引用数组
   * @param filenames 文件名数组
   * @returns Promise<void>
   */
  const downloadCharts = async (
    chartRefs: Array<SendEmailDto.ChartComponentRef | null>,
    filenames: string[]
  ): Promise<void> => {
    for (let i = 0; i < chartRefs.length; i++) {
      const chartRef = chartRefs[i]
      const filename = filenames[i]

      if (!chartRef) {
        console.warn(`图表 ${i + 1} 的引用不存在，跳过下载`)
        continue
      }

      try {
        await chartRef.downloadChart(filename, {
          type: 'image/png',
          quality: 1
        })
      } catch (error) {
        console.error(`下载图表 ${filename} 失败:`, error)
      }
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
    exportChartsFromRef,
    sendChartEmail,
    sendEmailFromChartRef,
    downloadCharts,
    validateEmail,
    validateEmails
  }
}
