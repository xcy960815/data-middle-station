import { ScheduledEmailService } from '../service/scheduledEmailService'

const scheduledEmailService = new ScheduledEmailService()

const logger = new Logger({
  fileName: 'scheduledEmails',
  folderName: 'api'
})

/**
 * 查询定时邮件任务列表
 */
export default defineEventHandler(async (event) => {
  try {
    const scheduledEmailListQuery = getQuery<ScheduledEmailDto.ScheduledEmailListQuery>(event)
    const result = await scheduledEmailService.getScheduledEmailList(scheduledEmailListQuery)
    return CustomResponse.success(result)
  } catch (error: any) {
    logger.error('查询定时邮件任务列表失败' + error.message)
    return CustomResponse.error(error instanceof Error ? error.message : '查询定时邮件任务列表失败')
  }
})
