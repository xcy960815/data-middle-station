import Joi from 'joi'
import { SendEmailService } from '../service/sendEmailService'

// 发送邮件
const sendEmailService = new SendEmailService()

const logger = new Logger({
  fileName: 'sendChartEmail',
  folderName: 'api'
})

// Joi 验证模式
const sendChartEmailSchema = Joi.object<SendEmailDto.SendChartEmailRequest>({
  emailConfig: Joi.object<SendEmailDto.EmailConfig>({
    to: Joi.string().email().required().messages({
      'string.email': '收件人邮箱格式不正确',
      'any.required': '收件人邮箱不能为空'
    }),
    subject: Joi.string().min(1).max(200).required().messages({
      'string.min': '邮件主题不能为空',
      'string.max': '邮件主题不能超过200个字符',
      'any.required': '邮件主题不能为空'
    }),
    additionalContent: Joi.string().max(5000).optional().messages({
      'string.max': '附加内容不能超过5000个字符'
    })
  }).required(),

  analyzeOptions: Joi.object<SendEmailDto.AnalyzeOptions>({
    filename: Joi.string().min(1).max(100).required().messages({
      'string.min': '文件名不能为空',
      'string.max': '文件名不能超过100个字符',
      'any.required': '文件名不能为空'
    }),
    chartType: Joi.string().valid('line', 'bar', 'pie', 'table', 'interval').required().messages({
      'any.only': '图表类型必须是 line、bar、pie、table 或 interval 之一',
      'any.required': '图表类型不能为空'
    }),
    analyzeName: Joi.string().min(1).max(100).required().messages({
      'string.min': '分析名称不能为空',
      'string.max': '分析名称不能超过100个字符',
      'any.required': '分析名称不能为空'
    }),
    analyzeId: Joi.number().integer().positive().required().messages({
      'number.base': '分析ID必须是数字',
      'number.integer': '分析ID必须是整数',
      'number.positive': '分析ID必须大于0',
      'any.required': '分析ID不能为空'
    })
  })
    .required()
    .messages({
      'any.required': '图表数据不能为空'
    })
})

export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailResponse>>>(async (event) => {
  try {
    const requestBody = await readBody<SendEmailDto.SendChartEmailRequest>(event)

    // 使用 Joi 进行数据验证
    const { error } = sendChartEmailSchema.validate(requestBody, {
      abortEarly: false, // 返回所有验证错误
      stripUnknown: true, // 移除未知字段
      convert: true // 自动类型转换
    })

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('; ')
      logger.warn(`图表邮件发送数据验证失败: ${errorMessage}`)
      return ApiResponse.error(errorMessage)
    }

    const sendEmailResult = await sendEmailService.sendMail(requestBody)

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
