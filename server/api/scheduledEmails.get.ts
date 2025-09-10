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
    const query = getQuery(event)

    const request: ScheduledEmailDto.ScheduledEmailListQuery = {
      page: query.page ? Number(query.page) : undefined,
      pageSize: query.pageSize ? Number(query.pageSize) : undefined,
      taskName: query.taskName as string,
      status: query.status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
      startTime: query.startTime as string,
      endTime: query.endTime as string
    }
    const result = await scheduledEmailService.getScheduledEmailList(request)
    return CustomResponse.success(result)
  } catch (error: any) {
    logger.error('查询定时邮件任务列表失败' + error.message)
    return CustomResponse.error(error instanceof Error ? error.message : '查询定时邮件任务列表失败')
  }
})
