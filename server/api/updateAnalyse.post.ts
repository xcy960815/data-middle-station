import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()
/**
 * @api {post} /analyse/updateAnalyse
 * @apiName updateAnalyse
 * @apiGroup analyse
 * @apiDescription 更新分析
 * @returns {Promise<ResponseModule.Response<number>>}
 */
export default defineEventHandler<Promise<ApiResponse<boolean>>>(async (event) => {
  try {
    const analyseOption = await readBody<AnalyseDto.AnalyseOption>(event)
    const data = await analyseService.updateAnalyse(analyseOption)
    return CustomResponse.success(data)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
