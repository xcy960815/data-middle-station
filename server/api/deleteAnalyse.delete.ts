import { AnalyseService } from '../service/analyseService'
const analyseService = new AnalyseService()

/**
 * @Desc 删除分析
 * @param event
 * @returns {Promise<ApiResponseI<boolean>>}
 */
export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const { id } = await readBody<AnalyseDto.DeleteAnalyseRequest>(event)
    const analyse = await analyseService.deleteAnalyse(id)
    return ApiResponse.success(analyse)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
