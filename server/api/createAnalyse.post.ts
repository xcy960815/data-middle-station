import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * @Desc 创建或者更新图表
 * @param event
 * @returns {Promise<ICustomResponse<number>>}
 */
export default defineEventHandler<
  Promise<ICustomResponse<boolean>>
>(async (event) => {
  try {
    const analyseParams =
      await readBody<AnalyseDto.AnalyseOption>(event)
    const analyse =
      await analyseService.createAnalyse(analyseParams)
    return CustomResponse.success(analyse)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
