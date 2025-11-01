import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * 更新分析名称
 * @param event
 * @returns {Promise<ApiResponseI<AnalyseVo.UpdateAnalyseNameResponse>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyseVo.UpdateAnalyseNameResponse>>>(async (event) => {
  try {
    const updateAnalyseNameRequest = await readBody<AnalyseDto.UpdateAnalyseNameRequest>(event)
    const updateAnalyseNameResult = await analyseService.updateAnalyseName(updateAnalyseNameRequest)
    return ApiResponse.success(updateAnalyseNameResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
