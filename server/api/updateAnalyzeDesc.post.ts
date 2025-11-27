import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()

/**
 * 更新分析描述
 * @param event
 * @returns {Promise<ApiResponseI<AnalyzeVo.UpdateAnalyzeDescResponse>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.UpdateAnalyzeDescResponse>>>(async (event) => {
  try {
    const updateAnalyzeDescRequest = await readBody<AnalyzeDto.UpdateAnalyzeDescOptions>(event)
    const updateAnalyzeDescResult = await analyzeService.updateAnalyzeDesc(updateAnalyzeDescRequest)
    return ApiResponse.success(updateAnalyzeDescResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
