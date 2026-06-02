import { DashboardService } from '@/server/service/dashboardService'

const dashboardService = new DashboardService()

/**
 * @desc 获取看板详情
 */
export default defineEventHandler<Promise<ApiResponseI<DashboardVo.DashboardDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<DashboardDto.GetDashboardRequest>(event)
    const dashboard = await dashboardService.getDashboard(body)
    return ApiResponse.success(dashboard)
  } catch (e: any) {
    return ApiResponse.error(e.message)
  }
})
