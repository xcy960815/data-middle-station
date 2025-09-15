import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * @Desc 创建或者更新图表
 * @param event
 * @returns {Promise<ApiResponseI<boolean>>}
 */
export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const analyseParams = await readBody<AnalyseDto.CreateAnalyseRequest>(event)
    const analyse = await analyseService.createAnalyse(analyseParams)
    return ApiResponse.success(analyse)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
