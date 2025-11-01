import { AnalyseService } from '../service/analyseService'
const analyseService = new AnalyseService()

/**
 * 删除分析
 * @param event
 * @returns {Promise<ApiResponseI<AnalyseVo.DeleteAnalyseResponse>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyseVo.DeleteAnalyseResponse>>>(async (event) => {
  try {
    const deleteAnalyseRequest = await readBody<AnalyseDto.DeleteAnalyseRequest>(event)
    const deleteAnalyseResult = await analyseService.deleteAnalyse(deleteAnalyseRequest)
    return ApiResponse.success(deleteAnalyseResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
