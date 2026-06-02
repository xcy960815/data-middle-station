import { DashboardService } from '@/server/service/dashboardService'

const dashboardService = new DashboardService()

/**
 * @desc 删除看板
 */
export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const body = await readBody<DashboardDto.DeleteDashboardRequest>(event)
    const result = await dashboardService.deleteDashboard(body)
    return ApiResponse.success(result)
  } catch (e: any) {
    return ApiResponse.error(e.message)
  }
})
