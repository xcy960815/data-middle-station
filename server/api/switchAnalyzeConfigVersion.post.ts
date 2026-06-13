import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()

/**
 * @desc API 处理器 - switchAnalyzeConfigVersion.post.ts (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.AnalyzeDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeConfigDto.SwitchAnalyzeConfigVersionRequest>(event)
    const result = await analyzeService.switchAnalyzeConfigVersion(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
