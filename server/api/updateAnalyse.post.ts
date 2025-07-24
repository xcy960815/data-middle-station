import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()
/**
 * @api {post} /analyse/updateChart
 * @apiName updateChart
 * @apiGroup analyse
 * @apiDescription 保存图表
 * @returns {Promise<ResponseModule.Response<number>>}
 */
export default defineEventHandler<Promise<ApiResponse<boolean>>>(async (event) => {
  try {
    const AnalyseOption = await readBody<AnalyseDto.AnalyseOption>(event)
    const data = await analyseService.updateAnalyse(AnalyseOption)
    return CustomResponse.success(data)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
