import { DashboardService } from '@/server/service/dashboardService'

const dashboardService = new DashboardService()

/**
 * @desc 更新看板
 */
export default defineEventHandler<Promise<ApiResponseI<DashboardVo.DashboardDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<DashboardDto.UpdateDashboardRequest>(event)
    const dashboard = await dashboardService.updateDashboard(body)
    return ApiResponse.success(dashboard)
  } catch (e: any) {
    return ApiResponse.error(e.message)
  }
})
