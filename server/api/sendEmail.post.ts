import { ScheduledEmailLogService } from '@/server/service/scheduledEmailLogService'
import { SendEmailService } from '@/server/service/sendEmailService'
import Joi from 'joi'

const sendEmailService = new SendEmailService()
const scheduledEmailLogService = new ScheduledEmailLogService()

const logger = new Logger({
  fileName: 'sendEmail',
  folderName: 'api'
})

// Joi 验证模式
const sendEmailSchema = Joi.object<SendEmailDto.SendEmailOptions>({
  emailConfig: Joi.object<SendEmailDto.EmailConfig>({
    to: Joi.string().email().required(),
    subject: Joi.string().required(),
    additionalContent: Joi.string().required()
  }),
  analyzeOptions: Joi.object<SendEmailDto.AnalyzeOptions>({
    filename: Joi.string().optional(),
    chartType: Joi.string().optional(),
    analyzeName: Joi.string().optional(),
    analyzeId: Joi.number().required()
  })
})

export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailOptions>>>(async (event) => {
  let sendEmailRequest: SendEmailDto.SendEmailOptions | null = null
  try {
    sendEmailRequest = await readBody<SendEmailDto.SendEmailOptions>(event)

    // 使用 Joi 进行数据验证
    const { error } = sendEmailSchema.validate(sendEmailRequest, {
      abortEarly: false, // 返回所有验证错误
      stripUnknown: true, // 移除未知字段
      convert: true // 自动类型转换
    })

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('; ')
      logger.warn(`邮件发送数据验证失败: ${errorMessage}`)
      return ApiResponse.error(errorMessage)
    }

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
