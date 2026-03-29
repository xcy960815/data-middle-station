import { ScheduledEmailLogService } from '@/server/service/scheduledEmailLogService'
import { SendEmailService } from '@/server/service/sendEmailService'
import Joi from 'joi'
import { MAIL_SUPPORTED_CHART_TYPES, validateEmailRecipients } from '~/shared/emailUtils'

const sendEmailService = new SendEmailService()
const scheduledEmailLogService = new ScheduledEmailLogService()

const logger = new Logger({
  fileName: 'sendEmail',
  folderName: 'api'
})

/**
 * 收件人校验器。
 * 允许前端传入单个邮箱、多个邮箱数组，或逗号分隔的字符串。
 */
const recipientsSchema = Joi.alternatives()
  .try(Joi.string(), Joi.array().items(Joi.string()))
  .required()
  .custom((value, helpers) => {
    const { valid, recipients, invalidRecipients } = validateEmailRecipients(value)

    if (!valid) {
      return helpers.error('any.custom', {
        customMessage:
          invalidRecipients.length > 0 ? `邮件地址格式错误: ${invalidRecipients.join(', ')}` : '收件人不能为空'
      })
    }

    return recipients
  })
  .messages({
    'any.custom': '{{#customMessage}}'
  })

/**
 * 即时邮件发送请求体验证模式。
 */
const sendEmailSchema = Joi.object<SendEmailDto.SendEmailOptions>({
  emailConfig: Joi.object<SendEmailDto.EmailConfig>({
    to: recipientsSchema,
    subject: Joi.string().required(),
    additionalContent: Joi.string().allow('').required()
  }),
  analyzeOptions: Joi.object<SendEmailDto.AnalyzeOptions>({
    filename: Joi.string().optional(),
    chartType: Joi.string()
      .valid(...MAIL_SUPPORTED_CHART_TYPES)
      .optional(),
    analyzeName: Joi.string().optional(),
    analyzeId: Joi.number().required()
  })
})

export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailOptions>>>(async (event) => {
  let sendEmailRequest: SendEmailDto.SendEmailOptions | null = null
  try {
    const requestBody = await readBody<SendEmailDto.SendEmailOptions>(event)

    // 使用 Joi 进行数据验证
    const { error, value: sendEmailOptions } = sendEmailSchema.validate(requestBody, {
      abortEarly: false, // 返回所有验证错误
      stripUnknown: true, // 移除未知字段
      convert: true // 自动类型转换
    })

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('; ')
      logger.warn(`邮件发送数据验证失败: ${errorMessage}`)
      return ApiResponse.error(errorMessage)
    }

    sendEmailRequest = sendEmailOptions

    const sendEmailResult = await sendEmailService.sendMail(sendEmailOptions)

    await scheduledEmailLogService
      .logManualSendSuccess(sendEmailResult, sendEmailOptions)
      .catch((logError) => logger.error(`记录即时发送日志失败: ${logError}`))

    logger.info(`邮件发送成功: ${sendEmailOptions.emailConfig.to}`)
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
