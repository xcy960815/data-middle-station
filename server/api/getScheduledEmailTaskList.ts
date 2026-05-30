import { getScheduledEmailService } from '@/server/features/email/service/scheduledEmailService'

const scheduledEmailService = getScheduledEmailService()

const logger = new Logger({
  fileName: 'scheduledEmails',
  folderName: 'api'
})

/**
 * 查询定时邮件任务列表
 */
export default defineEventHandler<Promise<ApiResponseI<ScheduledEmailVo.ScheduledEmailTaskListResponse>>>(
  async (event) => {
    try {
      const scheduledEmailListQuery = getQuery<ScheduledEmailDto.ScheduledEmailListRequest>(event)
      const scheduledEmailList = await scheduledEmailService.getScheduledEmailTaskList(scheduledEmailListQuery)
      return ApiResponse.success(scheduledEmailList)
    } catch (error: any) {
      logger.error('查询定时邮件任务列表失败' + error.message)
      return ApiResponse.error(error instanceof Error ? error.message : '查询定时邮件任务列表失败')
    }
  }
)
