import { ChartsService } from '../service/chartService'

const chartsService = new ChartsService()
/**
 * @api {post} /analyse/saveChartById
 * @apiName saveChartById
 * @apiGroup analyse
 * @apiDescription 保存图表
 * @returns {Promise<ResponseModule.Response<number>>}
 */
export default defineEventHandler<
  Promise<CustomResponseModule.Response<boolean>>
>(async (event) => {
  try {
    const chartsConfigDto =
      await readBody<ChartsConfigDto.ChartsConfig>(event)
    const data =
      await chartsService.updateChart(chartsConfigDto)
    return CustomResponse.success(data)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
