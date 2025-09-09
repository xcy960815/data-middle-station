import type { ChartEmailExportData } from '~/utils/chart-export'

/**
 * 图表邮件发送组合式函数
 */
export function useSendChartEmail() {
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
   * @returns Promise<{ success: boolean; messageId: string; message: string }>
   */
  const sendChartEmail = async (chart: ChartEmailExportData, emailOptions: SendEmailDto.EmailChartOptions) => {
    if (!chart) {
      throw new Error('没有可发送的图表')
    }

    const response = await $fetch('/api/sendChartEmail', {
      method: 'POST',
      body: {
        ...emailOptions,
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
    return sendChartEmail(chart, emailOptions)
  }

  /**
   * 下载单个图表
   * @param chartRef 图表组件引用
   * @param filename 文件名
   * @returns Promise<void>
   */
  const downloadChart = async (chartRef: SendEmailDto.ChartComponentRef | null, filename: string): Promise<void> => {
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
    exportChartsFromRef,
    sendChartEmail,
    sendEmailFromChartRef,
    downloadChart,
    validateEmail,
    validateEmails
  }
}
