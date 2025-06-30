import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * @api {post} /analyse/updateAnalyseDesc
 * @apiName updateAnalyseDesc
 * @apiGroup analyse
 * @apiDescription 更新图表描述
 * @returns {Promise<ResponseModule.Response<boolean>>}
 */
export default defineEventHandler<
  Promise<ICustomResponse<boolean>>
>(async (event) => {
  try {
    const analyseOption =
      await readBody<AnalyseDto.AnalyseOption>(event)
    const data =
      await analyseService.updateAnalyseDesc(analyseOption)
    return CustomResponse.success(data)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
