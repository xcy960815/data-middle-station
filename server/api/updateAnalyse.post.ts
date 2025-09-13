import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()
/**
 * @api {post} /analyse/updateAnalyse
 * @apiName updateAnalyse
 * @apiGroup analyse
 * @apiDescription 更新分析
 * @returns {Promise<ApiResponseI<boolean>>}
 */
export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const analyseOption = await readBody<AnalyseDto.UpdateAnalyseRequest>(event)
    const data = await analyseService.updateAnalyse(analyseOption)
    return ApiResponse.success(data)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
