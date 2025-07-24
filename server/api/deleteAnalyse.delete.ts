import { AnalyseService } from '../service/analyseService'
const analyseService = new AnalyseService()

/**
 * @Desc 删除分析
 * @param event
 * @returns {Promise<ApiResponse<boolean>>}
 */
export default defineEventHandler<Promise<ApiResponse<boolean>>>(async (event) => {
  try {
    const { id } = await readBody<{ id: number }>(event)
    const analyse = await analyseService.deleteAnalyse(id)
    return CustomResponse.success(analyse)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
