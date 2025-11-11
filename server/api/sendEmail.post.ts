import Joi from 'joi'
import { SendEmail } from '../utils/sendEmail'

const sendEmailUtil = new SendEmail()

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
    filename: Joi.string().required(),
    chartType: Joi.string().required(),
    analyzeName: Joi.string().required(),
    analyzeId: Joi.number().required()
  })
})

export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailResponse>>>(async (event) => {
  try {
    const sendChartEmailRequest = await readBody<SendEmailDto.SendChartEmailRequest>(event)

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

    const sendEmailResult = await sendEmailUtil.sendMail(sendChartEmailRequest)

    logger.info(`邮件发送成功: ${sendChartEmailRequest.emailConfig.to}`)
    return ApiResponse.success(sendEmailResult)
  } catch (error: any) {
    logger.error('发送邮件失败: ' + error.message)
    return ApiResponse.error(error instanceof Error ? error.message : '发送邮件失败')
  }
})
