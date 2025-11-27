import { ScheduledEmailService } from '@/server/service/scheduledEmailService'

const scheduledEmailService = new ScheduledEmailService()

/**
 * 测试执行定时邮件任务（用于测试服务端生成 echarts 图表）
 * @param event
 * @returns {Promise<ApiResponseI<boolean>>}
 */
export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const { taskId } = await readBody<{ taskId: number }>(event)

    if (!taskId || typeof taskId !== 'number') {
      return ApiResponse.error('任务ID不能为空且必须为数字')
    }

    const result = await scheduledEmailService.executeTaskWithOptions({ id: taskId })
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message || '执行任务失败')
  }
})
