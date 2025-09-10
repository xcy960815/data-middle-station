import { ScheduledEmailService } from '../service/scheduledEmailService'

const scheduledEmailService = new ScheduledEmailService()
const logger = new Logger({
  fileName: 'scheduledEmails',
  folderName: 'api'
})
/**
 * 创建定时邮件任务
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ScheduledEmailDto.CreateScheduledEmailRequest>(event)

    // 基础验证
    if (!body.taskName || !body.scheduleTime || !body.emailConfig) {
      throw new Error('必填参数不能为空')
    }

    if (!body.emailConfig.to || !body.emailConfig.subject) {
      throw new Error('邮件配置不完整')
    }

    const result = await scheduledEmailService.createScheduledEmail(body)

    return CustomResponse.success(result)
  } catch (error: any) {
    logger.error('创建定时邮件任务失败' + error.message)

    return CustomResponse.error(error instanceof Error ? error.message : '创建定时邮件任务失败')
  }
})
