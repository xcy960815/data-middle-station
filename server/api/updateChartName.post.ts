import { ChartService } from '../service/chartService'

const chartService = new ChartService()

/**
 * @api {post} /analyse/updateChartName
 * @apiName updateChartName
 * @apiGroup analyse
 * @apiDescription 更新图表名称
 * @returns {Promise<ResponseModule.Response<boolean>>}
 */
export default defineEventHandler<
  Promise<CustomResponseModule.Response<boolean>>
>(async (event) => {
  try {
    const chartOption =
      await readBody<ChartDto.ChartOption>(event)
    const data =
      await chartService.updateChartName(chartOption)
    return CustomResponse.success(data)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
