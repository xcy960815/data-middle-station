import { ChartDataService } from '@/server/service/chartDataService'
const chartDataService = new ChartDataService()

/**
 * @desc 查询图表数据
 * @param {QueryChartDataParams} params
 * @returns {Promise<ResponseModule.Response<AnalyzeDataVo.ChartData[]>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyzeDataVo.ChartData[]>>>(async (event) => {
  try {
    const chartDataParams = await readBody<AnalyzeDataDto.ChartDataOptions>(event)

    const data = await chartDataService.getAnalyzeData(chartDataParams)

    return ApiResponse.success(data)
  } catch (error: any) {
    console.error(error)
    return ApiResponse.error(error.message)
  }
})
