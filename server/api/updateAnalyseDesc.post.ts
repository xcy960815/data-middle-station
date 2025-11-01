import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * 更新分析描述
 * @param event
 * @returns {Promise<ApiResponseI<AnalyseVo.UpdateAnalyseDescResponse>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyseVo.UpdateAnalyseDescResponse>>>(async (event) => {
  try {
    const updateAnalyseDescRequest = await readBody<AnalyseDto.UpdateAnalyseDescRequest>(event)
    const updateAnalyseDescResult = await analyseService.updateAnalyseDesc(updateAnalyseDescRequest)
    return ApiResponse.success(updateAnalyseDescResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
