import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()
/**
 * @api {post} /analyze/updateAnalyze
 * @apiName updateAnalyze
 * @apiGroup analyze
 * @apiDescription 更新分析
 * @returns {Promise<ApiResponseI<AnalyzeVo.UpdateAnalyzeResponse>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.UpdateAnalyzeOptions>>>(async (event) => {
  try {
    const updateAnalyzeRequest = await readBody<AnalyzeDto.UpdateAnalyzeOptions>(event)
    const updateAnalyzeResult = await analyzeService.updateAnalyze(updateAnalyzeRequest)
    return ApiResponse.success(updateAnalyzeResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
