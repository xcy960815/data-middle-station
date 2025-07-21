import { ChartDataService } from '../service/chartDataService'
const chartDataService = new ChartDataService()

/**
 * @desc 查询图表数据
 * @param {QueryChartDataParams} params
 * @returns {Promise<ResponseModule.Response<ChartDataDao>>}
 */
export default defineEventHandler<Promise<ICustomResponse<AnalyseDao.ChartData>>>(async (event) => {
  try {
    const chartDataParams = await readBody<ChartDataDto.ChartData>(event)

    const data = await chartDataService.getChartData(chartDataParams)

    return CustomResponse.success(data)
  } catch (error: any) {
    console.error(error)
    return CustomResponse.error(error.message)
  }
})
