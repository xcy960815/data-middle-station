import { ScheduledEmailService } from '../service/scheduledEmailService'

const scheduledEmailService = new ScheduledEmailService()
const logger = new Logger({
  fileName: 'scheduledEmails',
  folderName: 'api'
})
/**
 * 创建定时邮件任务
 */
export default defineEventHandler<Promise<ApiResponse<boolean>>>(async (event) => {
  try {
    const scheduledEmailOptions = await readBody<ScheduledEmailDto.CreateScheduledEmailOptions>(event)

    // 基础验证
    if (!scheduledEmailOptions.taskName || !scheduledEmailOptions.scheduleTime || !scheduledEmailOptions.emailConfig) {
      throw new Error('必填参数不能为空')
    }

    if (!scheduledEmailOptions.emailConfig.to || !scheduledEmailOptions.emailConfig.subject) {
      throw new Error('邮件配置不完整')
    }

    const result = await scheduledEmailService.createScheduledEmail(scheduledEmailOptions)

    return CustomResponse.success(result)
  } catch (error: any) {
    logger.error('创建定时邮件任务失败' + error.message)

    return CustomResponse.error(error instanceof Error ? error.message : '创建定时邮件任务失败')
  }
})
