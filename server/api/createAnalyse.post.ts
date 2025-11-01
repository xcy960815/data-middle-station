import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * 创建分析
 * @param event
 * @returns {Promise<ApiResponseI<AnalyseVo.CreateAnalyseResponse>>}
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyseVo.CreateAnalyseResponse>>>(async (event) => {
  try {
    const createAnalyseRequest = await readBody<AnalyseDto.CreateAnalyseRequest>(event)
    const createAnalyseResult = await analyseService.createAnalyse(createAnalyseRequest)
    return ApiResponse.success(createAnalyseResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
