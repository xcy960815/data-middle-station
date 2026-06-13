import { getScheduledEmailLogService } from '@/server/features/email/service/scheduledEmailLogService'
import {
  formatSendEmailValidationError,
  getSendEmailService,
  manualSendEmailSchema,
  validateSendEmailPayload
} from '@/server/features/email/service/sendEmailService'

const sendEmailService = getSendEmailService()
const scheduledEmailLogService = getScheduledEmailLogService()

const logger = new Logger({
  fileName: 'sendEmail',
  folderName: 'api'
})

/**
 * @desc API 处理器 - sendEmail.post.ts (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailResponse>>>(async (event) => {
  let sendEmailRequest: SendEmailDto.SendChartEmailRequest | null = null
  try {
    const requestBody = await readBody<SendEmailDto.SendChartEmailRequest>(event)

    const { error, value } = validateSendEmailPayload(manualSendEmailSchema, requestBody)

    if (error) {
      const errorMessage = formatSendEmailValidationError(error)
      logger.warn(`邮件发送数据验证失败: ${errorMessage}`)
      return ApiResponse.error(errorMessage)
    }

    sendEmailRequest = value

    const sendEmailResult = await sendEmailService.sendMail(sendEmailRequest)

    await scheduledEmailLogService
      .logManualSendSuccess(sendEmailResult, sendEmailRequest)
      .catch((logError) => logger.error(`记录即时发送日志失败: ${logError}`))

    logger.info(`邮件发送成功: ${sendEmailRequest.emailConfig.to}`)
    return ApiResponse.success(sendEmailResult)
  } catch (error: any) {
    const errorMessage = error?.message || '发送邮件失败'
    if (sendEmailRequest) {
      await scheduledEmailLogService
        .logManualSendFailure(sendEmailRequest, errorMessage)
        .catch((logError) => logger.error(`记录失败日志异常: ${logError}`))
    }
    logger.error('发送邮件失败: ' + error.message)
    return ApiResponse.error(errorMessage)
  }
})
