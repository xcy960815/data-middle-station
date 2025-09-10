import { ChartEmailService } from '../service/chartEmailService'
import { CustomResponse } from '../utils/customResponse'

// 发送邮件
const chartEmailService = new ChartEmailService()

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SendEmailDto.SendChartEmailOptions>(event)
    const { to, subject, additionalContent, cc, bcc, chart } = body

    // 验证必填字段
    if (!to || !subject) {
      throw createError({
        statusCode: 400,
        statusMessage: '"to" 和 "subject" 为必填项'
      })
    }

    // 验证图表数据
    if (!chart || !chart.title || !chart.base64Image || !chart.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: '图表缺少必要字段: title, (base64Image 或 imageData), filename'
      })
    }

    // 转换图表数据格式
    const chartEmailData: SendEmailDto.ChartEmailExportData = {
      chartId: chart.chartId,
      title: chart.title,
      base64Image: chart.base64Image || '',
      filename: chart.filename
    }

    const messageId = await chartEmailService.sendChartEmail({
      to,
      subject,
      chart: chartEmailData,
      additionalContent,
      cc,
      bcc
    })

    return CustomResponse.success({
      messageId,
      message: '邮件发送成功'
    })
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
