import { ScheduledEmailLogService } from '@/server/features/email/service/scheduledEmailLogService'
import {
  formatSendEmailValidationError,
  manualSendEmailSchema,
  SendEmailService,
  validateSendEmailPayload
} from '@/server/features/email/service/sendEmailService'

const sendEmailService = new SendEmailService()
const scheduledEmailLogService = new ScheduledEmailLogService()

const logger = new Logger({
  fileName: 'sendEmail',
  folderName: 'api'
})

export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailOptions>>>(async (event) => {
  let sendEmailRequest: SendEmailDto.SendEmailOptions | null = null
  try {
    const requestBody = await readBody<SendEmailDto.SendEmailOptions>(event)

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
