import { DashboardService } from '@/server/service/dashboardService'

const dashboardService = new DashboardService()

/**
 * @desc API 处理器 - getDashboardConfigHistory.post.ts (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<DashboardVo.DashboardConfigHistoryItem[]>>>(async (event) => {
  try {
    const body = await readBody<DashboardDto.GetDashboardConfigHistoryRequest>(event)
    const result = await dashboardService.getDashboardConfigHistory(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
