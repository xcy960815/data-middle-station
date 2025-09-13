import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * @api {post} /analyse/updateAnalyseName
 * @apiName updateAnalyseName
 * @apiGroup analyse
 * @apiDescription 更新图表名称
 * @returns {Promise<ResponseModule.Response<boolean>>}
 */
export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const analyseOption = await readBody<AnalyseDto.AnalyseOption>(event)
    const data = await analyseService.updateAnalyseName(analyseOption)
    return ApiResponse.success(data)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
