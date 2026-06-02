import { DashboardService } from '@/server/service/dashboardService'

const dashboardService = new DashboardService()

/**
 * @desc 获取看板列表
 */
export default defineEventHandler<Promise<ApiResponseI<DashboardVo.DashboardListResponse>>>(async (event) => {
  try {
    const body = (await readBody<DashboardDto.GetDashboardListRequest>(event).catch(() => ({}))) || {}
    const dashboards = await dashboardService.getDashboards(body)
    return ApiResponse.success(dashboards)
  } catch (e: any) {
    return ApiResponse.error(e.message)
  }
})
