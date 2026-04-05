import {
  chartSendEmailSchema,
  formatSendEmailValidationError,
  SendEmailService,
  validateSendEmailPayload
} from '@/server/service/sendEmailService'

// 发送邮件
const sendEmailService = new SendEmailService()

const logger = new Logger({
  fileName: 'sendChartEmail',
  folderName: 'api'
})

export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailOptions>>>(async (event) => {
  try {
    const requestBody = await readBody<SendEmailDto.SendEmailOptions>(event)

    const { error, value } = validateSendEmailPayload(chartSendEmailSchema, requestBody)

    if (error) {
      const errorMessage = formatSendEmailValidationError(error)
      logger.warn(`图表邮件发送数据验证失败: ${errorMessage}`)
      return ApiResponse.error(errorMessage)
    }

    const sendEmailResult = await sendEmailService.sendMail(value)

    return ApiResponse.success(sendEmailResult)
  } catch (error: any) {
    logger.error('发送图表邮件失败: ' + error.message)

    // 如果是已知错误，直接抛出
    if (error.statusCode) {
      return ApiResponse.error(error.message)
    }

    // 其他错误
    return ApiResponse.error(error instanceof Error ? error.message : '发送图表邮件失败')
  }
})
