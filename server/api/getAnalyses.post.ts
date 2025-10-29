import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * @desc 获取分析列表
 * @api {post} /analyse/getAnalyses
 */
export default defineEventHandler<Promise<ApiResponseI<Array<AnalyseVo.AnalyseResponse>>>>(async () => {
  try {
    const analyses = await analyseService.getAnalyses()
    return ApiResponse.success(analyses)
  } catch (e: any) {
    return ApiResponse.error(e.message)
  }
})
