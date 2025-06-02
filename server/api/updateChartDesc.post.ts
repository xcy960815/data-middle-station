import { ChartService } from '../service/chartService'

const chartService = new ChartService()

/**
 * @api {post} /analyse/updateChartDesc
 * @apiName updateChartDesc
 * @apiGroup analyse
 * @apiDescription 更新图表描述
 * @returns {Promise<ResponseModule.Response<boolean>>}
 */
export default defineEventHandler<
  Promise<CustomResponseModule.Response<boolean>>
>(async (event) => {
  try {
    const chartOption =
      await readBody<ChartDto.ChartOption>(event)
    const data =
      await chartService.updateChartDesc(chartOption)
    return CustomResponse.success(data)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
