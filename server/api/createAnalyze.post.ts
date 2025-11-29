import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()

/**
 * 创建分析
 * @param event
 * @returns {Promise<ApiResponseI<AnalyzeVo.CreateAnalyzeResponse>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.CreateAnalyzeOptions>>>(async (event) => {
  try {
    const createAnalyzeRequest = await readBody<AnalyzeDto.CreateAnalyzeOptions>(event)
    const createAnalyzeResult = await analyzeService.createAnalyze(createAnalyzeRequest)
    return ApiResponse.success(createAnalyzeResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
