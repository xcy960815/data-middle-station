import { ScheduledEmailLogService } from '@/server/service/scheduledEmailLogService'
import { SendEmailService } from '@/server/service/sendEmailService'
import type { H3Event } from 'h3'
import Joi from 'joi'
import { MAIL_SUPPORTED_CHART_TYPES, validateEmailRecipients } from '~/shared/emailUtils'

const sendEmailService = new SendEmailService()
const scheduledEmailLogService = new ScheduledEmailLogService()

interface HandleSendEmailRequestOptions {
  schema: Joi.ObjectSchema<SendEmailDto.SendEmailOptions>
  logger: Logger
  sceneLabel: string
  defaultErrorMessage: string
  logManualSend?: boolean
}

/**
 * 邮件接口共用的收件人校验器。
 * 允许单个邮箱、多个邮箱数组，或逗号分隔的字符串。
 */
export const emailRecipientsSchema = Joi.alternatives()
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
 * 即时邮件发送请求校验模式。
 */
export const sendEmailSchema = Joi.object<SendEmailDto.SendEmailOptions>({
  emailConfig: Joi.object<SendEmailDto.EmailConfig>({
    to: emailRecipientsSchema,
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

/**
 * 图表邮件发送请求校验模式。
 */
export const sendChartEmailSchema = Joi.object<SendEmailDto.SendEmailOptions>({
  emailConfig: Joi.object<SendEmailDto.EmailConfig>({
    to: emailRecipientsSchema.messages({
      'any.required': '收件人邮箱不能为空'
    }),
    subject: Joi.string().min(1).max(200).required().messages({
      'string.min': '邮件主题不能为空',
      'string.max': '邮件主题不能超过200个字符',
      'any.required': '邮件主题不能为空'
    }),
    additionalContent: Joi.string().allow('').max(5000).optional().messages({
      'string.max': '附加内容不能超过5000个字符'
    })
  }).required(),
  analyzeOptions: Joi.object<SendEmailDto.AnalyzeOptions>({
    filename: Joi.string().min(1).max(100).optional().messages({
      'string.min': '文件名不能为空',
      'string.max': '文件名不能超过100个字符'
    }),
    chartType: Joi.string()
      .valid(...MAIL_SUPPORTED_CHART_TYPES)
      .optional()
      .messages({
        'any.only': `图表类型必须是 ${MAIL_SUPPORTED_CHART_TYPES.join('、')} 之一`
      }),
    analyzeName: Joi.string().min(1).max(100).optional().messages({
      'string.min': '分析名称不能为空',
      'string.max': '分析名称不能超过100个字符'
    }),
    analyzeId: Joi.number().integer().positive().required().messages({
      'number.base': '分析ID必须是数字',
      'number.integer': '分析ID必须是整数',
      'number.positive': '分析ID必须大于0',
      'any.required': '分析ID不能为空'
    })
  }).required()
})

/**
 * 邮件发送接口共用处理流程。
 */
export async function handleSendEmailRequest(
  event: H3Event,
  options: HandleSendEmailRequestOptions
): Promise<ApiResponseI<SendEmailVo.SendEmailOptions>> {
  let sendEmailRequest: SendEmailDto.SendEmailOptions | null = null

  try {
    const requestBody = await readBody<SendEmailDto.SendEmailOptions>(event)
    const { error, value: sendEmailOptions } = options.schema.validate(requestBody, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    })

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('; ')
      options.logger.warn(`${options.sceneLabel}发送数据验证失败: ${errorMessage}`)
      return ApiResponse.error(errorMessage)
    }

    sendEmailRequest = sendEmailOptions

    const sendEmailResult = await sendEmailService.sendMail(sendEmailOptions)

    if (options.logManualSend) {
      await scheduledEmailLogService
        .logManualSendSuccess(sendEmailResult, sendEmailOptions)
        .catch((logError) => options.logger.error(`记录即时发送日志失败: ${logError}`))
    }

    options.logger.info(`${options.sceneLabel}发送成功: ${sendEmailOptions.emailConfig.to}`)
    return ApiResponse.success(sendEmailResult)
  } catch (error: any) {
    const errorMessage = error?.message || options.defaultErrorMessage

    if (options.logManualSend && sendEmailRequest) {
      await scheduledEmailLogService
        .logManualSendFailure(sendEmailRequest, errorMessage)
        .catch((logError) => options.logger.error(`记录失败日志异常: ${logError}`))
    }

    options.logger.error(`${options.sceneLabel}发送失败: ${errorMessage}`)
    return ApiResponse.error(errorMessage)
  }
}
