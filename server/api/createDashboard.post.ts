import { DashboardService } from '@/server/service/dashboardService'

const dashboardService = new DashboardService()

/**
 * @desc 创建看板
 */
export default defineEventHandler<Promise<ApiResponseI<DashboardVo.DashboardDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<DashboardDto.CreateDashboardRequest>(event)
    const dashboard = await dashboardService.createDashboard(body)
    return ApiResponse.success(dashboard)
  } catch (e: any) {
    return ApiResponse.error(e.message)
  }
})
