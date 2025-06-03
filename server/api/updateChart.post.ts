import { ChartService } from '../service/chartService'

const chartService = new ChartService()
/**
 * @api {post} /analyse/updateChart
 * @apiName updateChart
 * @apiGroup analyse
 * @apiDescription 保存图表
 * @returns {Promise<ResponseModule.Response<number>>}
 */
export default defineEventHandler<
  Promise<CustomResponseModule.Response<boolean>>
>(async (event) => {
  try {
    const chartOption =
      await readBody<ChartDto.ChartOption>(event)
    const data = await chartService.updateChart(chartOption)
    return CustomResponse.success(data)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
