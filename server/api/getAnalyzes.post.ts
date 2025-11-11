import { AnalyzeService } from '../service/analyzeService'

const analyzeService = new AnalyzeService()

/**
 * @desc 获取分析列表
 * @param event
 * @returns {Promise<ApiResponseI<Array<AnalyzeVo.GetAnalyzeResponse>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<AnalyzeVo.GetAnalyzeResponse>>>>(async () => {
  try {
    const getAnalyzesResult = await analyzeService.getAnalyzes()
    return ApiResponse.success(getAnalyzesResult)
  } catch (e: any) {
    return ApiResponse.error(e.message)
  }
})
