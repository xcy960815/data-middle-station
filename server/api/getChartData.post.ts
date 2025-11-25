import { ChartDataService } from '@/server/service/chartDataService'
const chartDataService = new ChartDataService()

/**
 * @desc 查询图表数据
 * @param {QueryChartDataParams} params
 * @returns {Promise<ResponseModule.Response<ChartDataVo.ChartData[]>>}
 */
export default defineEventHandler<Promise<ApiResponseI<ChartDataVo.ChartData[]>>>(async (event) => {
  try {
    const chartDataParams = await readBody<ChartDataDto.ChartDataRequest>(event)

    const data = await chartDataService.getChartData(chartDataParams)

    return ApiResponse.success(data)
  } catch (error: any) {
    console.error(error)
    return ApiResponse.error(error.message)
  }
})
