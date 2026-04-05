import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()

/**
 * @desc 获取分析列表
 * @param event
 * @returns {Promise<ApiResponseI<AnalyzeVo.GetAnalyzesOptions>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.GetAnalyzesOptions>>>(async (event) => {
  try {
    const body = (await readBody<AnalyzeDto.GetAnalyzesOptions>(event).catch(() => ({}))) || {}
    const getAnalyzesResult = await analyzeService.getAnalyzes(body)
    return ApiResponse.success(getAnalyzesResult)
  } catch (e: any) {
    return ApiResponse.error(e.message)
  }
})
