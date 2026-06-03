import { DashboardService } from '@/server/service/dashboardService'

const dashboardService = new DashboardService()

export default defineEventHandler<Promise<ApiResponseI<DashboardVo.DashboardConfigHistoryItem[]>>>(async (event) => {
  try {
    const body = await readBody<DashboardDto.GetDashboardConfigHistoryRequest>(event)
    const result = await dashboardService.getDashboardConfigHistory(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
