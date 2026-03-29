import { SendEmailService } from '@/server/service/sendEmailService'
import Joi from 'joi'
import { MAIL_SUPPORTED_CHART_TYPES, validateEmailRecipients } from '~/shared/emailUtils'

// 发送邮件
const sendEmailService = new SendEmailService()

const logger = new Logger({
  fileName: 'sendChartEmail',
  folderName: 'api'
})

/**
 * 图表邮件接口的收件人校验器。
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
 * 图表邮件发送请求的 Joi 校验模式。
 */
const sendChartEmailSchema = Joi.object<SendEmailDto.SendEmailOptions>({
  emailConfig: Joi.object<SendEmailDto.EmailConfig>({
    to: recipientsSchema.messages({
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

export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailOptions>>>(async (event) => {
  try {
    const requestBody = await readBody<SendEmailDto.SendEmailOptions>(event)

    // 使用 Joi 进行数据验证
    const { error, value: sendEmailOptions } = sendChartEmailSchema.validate(requestBody, {
      abortEarly: false, // 返回所有验证错误
      stripUnknown: true, // 移除未知字段
      convert: true // 自动类型转换
    })

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('; ')
      logger.warn(`图表邮件发送数据验证失败: ${errorMessage}`)
      return ApiResponse.error(errorMessage)
    }

    const sendEmailResult = await sendEmailService.sendMail(sendEmailOptions)

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
