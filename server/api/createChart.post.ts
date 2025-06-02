import { ChartsService } from '../service/chartService'
const chartsService = new ChartsService()

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
      await readBody<ChartsConfigDto.ChartsConfig>(event)
    const chart = await chartsService.createChart(
      chartsParamsOption
    )
    return CustomResponse.success(chart)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
