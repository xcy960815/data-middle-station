import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()

/**
 * 更新分析名称
 * @param event
 * @returns {Promise<ApiResponseI<AnalyzeVo.UpdateAnalyzeNameResponse>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.UpdateAnalyzeNameResponse>>>(async (event) => {
  try {
    const updateAnalyzeNameRequest = await readBody<AnalyzeDto.UpdateAnalyzeNameOptions>(event)
    const updateAnalyzeNameResult = await analyzeService.updateAnalyzeName(updateAnalyzeNameRequest)
    return ApiResponse.success(updateAnalyzeNameResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
