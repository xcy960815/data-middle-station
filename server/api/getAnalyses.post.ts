import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * @desc 获取分析列表
 * @param event
 * @returns {Promise<ApiResponseI<Array<AnalyseVo.GetAnalyseResponse>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<AnalyseVo.GetAnalyseResponse>>>>(async () => {
  try {
    const getAnalysesResult = await analyseService.getAnalyses()
    return ApiResponse.success(getAnalysesResult)
  } catch (e: any) {
    return ApiResponse.error(e.message)
  }
})
