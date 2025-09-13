import Joi from 'joi'
import { SendEmailService } from '../service/sendEmailService'

const sendEmailService = new SendEmailService()

const logger = new Logger({
  fileName: 'sendEmail',
  folderName: 'api'
})

// Joi 验证模式
const sendEmailSchema = Joi.object<SendEmailDto.SendChartEmailOptions>({
  emailConfig: Joi.object<SendEmailDto.EmailConfig>({
    to: Joi.string().email().required(),
    subject: Joi.string().required(),
    additionalContent: Joi.string().required()
  }),
  analyseOptions: Joi.object<SendEmailDto.AnalyseOptions>({
    filename: Joi.string().required(),
    chartType: Joi.string().required(),
    analyseName: Joi.string().required(),
    analyseId: Joi.number().required()
  })
})
  .custom((value, helpers) => {
    // 自定义验证：html 和 text 至少提供一个
    if (!value.emailConfig.additionalContent) {
      return helpers.error('custom.contentRequired')
    }
    return value
  })
  .messages({
    'custom.contentRequired': '邮件内容不能为空，请提供HTML内容或纯文本内容'
  })

export default defineEventHandler(async (event) => {
  try {
    const requestBody = await readBody<SendEmailDto.SendChartEmailOptions>(event)

    // 使用 Joi 进行数据验证
    const { error } = sendEmailSchema.validate(requestBody, {
      abortEarly: false, // 返回所有验证错误
      stripUnknown: true, // 移除未知字段
      convert: true // 自动类型转换
    })

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('; ')
      logger.warn(`邮件发送数据验证失败: ${errorMessage}`)
      return ApiResponse.error(errorMessage)
    }

    const sendEmailResult = await sendEmailService.sendMail(requestBody)

    logger.info(`邮件发送成功: ${requestBody.emailConfig.to}`)
    return ApiResponse.success(sendEmailResult)
  } catch (error: any) {
    logger.error('发送邮件失败: ' + error.message)
    return ApiResponse.error(error instanceof Error ? error.message : '发送邮件失败')
  }
})
