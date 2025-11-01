import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()
/**
 * @api {post} /analyse/updateAnalyse
 * @apiName updateAnalyse
 * @apiGroup analyse
 * @apiDescription 更新分析
 * @returns {Promise<ApiResponseI<AnalyseVo.UpdateAnalyseResponse>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyseVo.UpdateAnalyseResponse>>>(async (event) => {
  try {
    const updateAnalyseRequest = await readBody<AnalyseDto.UpdateAnalyseRequest>(event)
    const updateAnalyseResult = await analyseService.updateAnalyse(updateAnalyseRequest)
    return ApiResponse.success(updateAnalyseResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
