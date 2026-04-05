import { ChartDataService } from '@/server/service/chartDataService'
const chartDataService = new ChartDataService()

/**
 * @desc 查询图表数据
 * @param {QueryChartDataParams} params
 * @returns {Promise<ResponseModule.Response<AnalyzeDataVo.AnalyzeData[]>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyzeDataVo.AnalyzeData[]>>>(async (event) => {
  let analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery | null = null
  try {
    analyzeDataQuery = await readBody<AnalyzeDataDto.AnalyzeDataQuery | null>(event)
    if (!analyzeDataQuery) {
      throw new Error('查询参数不能为空')
    }

    const data = await chartDataService.getAnalyzeData(analyzeDataQuery)

    return ApiResponse.success(data)
  } catch (error: any) {
    console.error(error)
    return ApiResponse.error(error.message, error.sql, analyzeDataQuery)
  }
})
