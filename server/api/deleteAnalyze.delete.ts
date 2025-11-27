import { AnalyzeService } from '@/server/service/analyzeService'
const analyzeService = new AnalyzeService()

/**
 * 删除分析
 * @param event
 * @returns {Promise<ApiResponseI<AnalyzeVo.DeleteAnalyzeResponse>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.DeleteAnalyzeResponse>>>(async (event) => {
  try {
    const deleteAnalyzeRequest = await readBody<AnalyzeDto.DeleteAnalyzeOptions>(event)
    const deleteAnalyzeResult = await analyzeService.deleteAnalyze(deleteAnalyzeRequest)
    return ApiResponse.success(deleteAnalyzeResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
