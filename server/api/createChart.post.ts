import { ChartService } from '../service/chartService'
const chartService = new ChartService()

/**
 * @Desc 创建或者更新图表
 * @param event
 * @returns {Promise<CustomResponseModule.Response<number>>}
 */
export default defineEventHandler<
  Promise<CustomResponseModule.Response<boolean>>
>(async (event) => {
  try {
    const chartsParamsOption =
      await readBody<ChartDto.ChartOption>(event)
    const chart = await chartService.createChart(
      chartsParamsOption
    )
    return CustomResponse.success(chart)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
