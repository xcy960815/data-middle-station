import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * @api {post} /analyse/updateAnalyseDesc
 * @apiName updateAnalyseDesc
 * @apiGroup analyse
 * @apiDescription 更新图表描述
 * @returns {Promise<ApiResponseI<boolean>>}
 */
export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const analyseOption = await readBody<AnalyseDto.UpdateAnalyseDescRequest>(event)
    const data = await analyseService.updateAnalyseDesc(analyseOption)
    return ApiResponse.success(data)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
