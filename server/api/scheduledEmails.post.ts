import Joi from 'joi'
import { ScheduledEmailService } from '@/server/service/scheduledEmailService'

const scheduledEmailService = new ScheduledEmailService()

const logger = new Logger({
  fileName: 'scheduledEmails',
  folderName: 'api'
})

// Joi 验证模式
const createScheduledEmailSchema = Joi.object<ScheduledEmailDto.CreateScheduledEmailRequest>({
  taskName: Joi.string().min(1).max(100).required().messages({
    'string.min': '任务名称不能为空',
    'string.max': '任务名称不能超过100个字符',
    'any.required': '任务名称不能为空'
  }),
  taskType: Joi.string().valid('scheduled', 'recurring').required().messages({
    'any.only': '任务类型必须是 scheduled 或 recurring',
    'any.required': '任务类型不能为空'
  }),
  scheduleTime: Joi.when('taskType', {
    is: 'scheduled',
    then: Joi.string()
      .isoDate()
      .required()
      .custom((value, helpers) => {
        const scheduleTime = new Date(value)
        const now = new Date()
        if (scheduleTime <= now) {
          return helpers.error('custom.futureDate')
        }
        return value
      })
      .messages({
        'string.isoDate': '执行时间格式不正确，请使用 ISO 8601 格式',
        'any.required': '定时任务必须指定执行时间',
        'custom.futureDate': '执行时间必须大于当前时间'
      }),
    otherwise: Joi.optional()
  }),
  recurringDays: Joi.when('taskType', {
    is: 'recurring',
    then: Joi.array().items(Joi.number().integer().min(0).max(6)).min(1).max(7).required().messages({
      'array.min': '重复任务必须至少选择一个执行日期',
      'array.max': '重复任务最多选择7个执行日期',
      'number.min': '星期数必须在0-6之间（0=周日，6=周六）',
      'number.max': '星期数必须在0-6之间（0=周日，6=周六）',
      'any.required': '重复任务必须指定重复日期'
    }),
    otherwise: Joi.optional()
  }),
  recurringTime: Joi.when('taskType', {
    is: 'recurring',
    then: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': '重复任务执行时间格式不正确，请使用 HH:mm 格式',
        'any.required': '重复任务必须指定执行时间'
      }),
    otherwise: Joi.optional()
  }),
  emailConfig: Joi.object<ScheduledEmailDto.EmailConfig>({
    to: Joi.string().email().required().messages({
      'string.email': '收件人邮箱格式不正确',
      'any.required': '收件人不能为空'
    }),
    subject: Joi.string().min(1).max(200).required().messages({
      'string.min': '邮件主题不能为空',
      'string.max': '邮件主题不能超过200个字符',
      'any.required': '邮件主题不能为空'
    }),
    additionalContent: Joi.string().allow('').max(2000).optional().messages({
      'string.max': '邮件内容不能超过2000个字符'
    })
  }).required(),
  analyzeOptions: Joi.object<ScheduledEmailDto.AnalyzeOptions>({
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
  }).required(),
  remark: Joi.string().allow('').max(500).optional().messages({
    'string.max': '备注不能超过500个字符'
  })
})

/**
 * 创建定时邮件任务
 */
export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const requestBody = await readBody<ScheduledEmailDto.CreateScheduledEmailRequest>(event)

    // 使用 Joi 进行数据验证
    const { error, value: scheduledEmailOptions } = createScheduledEmailSchema.validate(requestBody, {
      abortEarly: false, // 返回所有验证错误
      stripUnknown: true, // 移除未知字段
      convert: true // 自动类型转换
    })

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('; ')
      logger.warn(`定时邮件任务验证失败: ${errorMessage}`)
      return ApiResponse.error(errorMessage)
    }

    // 验证通过，执行业务逻辑
    const result = await scheduledEmailService.createScheduledEmail(scheduledEmailOptions)

    logger.info(`定时邮件任务创建成功: ${scheduledEmailOptions.taskName}`)
    return ApiResponse.success(result)
  } catch (error: any) {
    logger.error('创建定时邮件任务失败: ' + error.message)

    return ApiResponse.error(error instanceof Error ? error.message : '创建定时邮件任务失败')
  }
})
