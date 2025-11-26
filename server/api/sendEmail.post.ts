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
const sendEmailSchema = Joi.object<SendEmailDto.SendChartEmailRequest>({
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

export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailResponse>>>(async (event) => {
  let sendChartEmailRequest: SendEmailDto.SendChartEmailRequest | null = null
  try {
    sendChartEmailRequest = await readBody<SendEmailDto.SendChartEmailRequest>(event)

    // 使用 Joi 进行数据验证
    const { error } = sendEmailSchema.validate(sendChartEmailRequest, {
      abortEarly: false, // 返回所有验证错误
      stripUnknown: true, // 移除未知字段
      convert: true // 自动类型转换
    })

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('; ')
      logger.warn(`邮件发送数据验证失败: ${errorMessage}`)
      return ApiResponse.error(errorMessage)
    }

    const sendEmailResult = await sendEmailService.sendMail(sendChartEmailRequest)

    await scheduledEmailLogService
      .logManualSendSuccess(sendEmailResult, sendChartEmailRequest)
      .catch((logError) => logger.error(`记录即时发送日志失败: ${logError}`))

    logger.info(`邮件发送成功: ${sendChartEmailRequest.emailConfig.to}`)
    return ApiResponse.success(sendEmailResult)
  } catch (error: any) {
    const errorMessage = error?.message || '发送邮件失败'
    if (sendChartEmailRequest) {
      await scheduledEmailLogService
        .logManualSendFailure(sendChartEmailRequest, errorMessage)
        .catch((logError) => logger.error(`记录失败日志异常: ${logError}`))
    }
    logger.error('发送邮件失败: ' + error.message)
    return ApiResponse.error(errorMessage)
  }
})
