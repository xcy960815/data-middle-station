import type { ChartEmailExportData } from '~/utils/chart-export'
import { ChartEmailService } from '../service/chartEmailService'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SendEmailDto.SendChartEmailRequest>(event)
    const { to, subject, charts, additionalContent, cc, bcc } = body || {}

    // 验证必填字段
    if (!to || !subject || !charts || !Array.isArray(charts) || charts.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '"to"、"subject" 和 "charts" 为必填项，且 charts 不能为空'
      })
    }

    // 验证图表数据
    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i]
      if (!chart.title || (!chart.base64Image && !chart.imageData) || !chart.filename) {
        throw createError({
          statusCode: 400,
          statusMessage: `图表 ${i + 1} 缺少必要字段: title, (base64Image 或 imageData), filename`
        })
      }
    }

    // 转换图表数据格式
    const chartEmailData: ChartEmailExportData[] = charts.map((chart, index) => ({
      chartId: `chart_${index}`,
      title: chart.title,
      base64Image: chart.base64Image || chart.imageData || '',
      filename: chart.filename
    }))

    // 发送邮件
    const chartEmailService = new ChartEmailService()
    const messageId = await chartEmailService.sendChartEmail({
      to,
      subject,
      charts: chartEmailData,
      additionalContent,
      cc,
      bcc
    })

    return {
      success: true,
      messageId,
      message: `邮件发送成功，包含 ${charts.length} 个图表`
    }
  } catch (error: any) {
    console.error('发送图表邮件失败:', error)

    // 如果是已知错误，直接抛出
    if (error.statusCode) {
      throw error
    }

    // 其他错误
    throw createError({
      statusCode: 500,
      statusMessage: `发送图表邮件失败: ${error.message}`
    })
  }
})
