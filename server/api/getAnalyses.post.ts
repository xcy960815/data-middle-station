import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

/**
 * @desc 获取分析列表
 * @api {post} /analyse/getAnalyses
 * @apiName getAnalyses
 * @apiDescription 获取分析列表
 * @apiGroup Analyse
 * @apiPermission public
 * @apiVersion 1.0.0
 * @apiSampleRequest http://localhost:3000/api/getAnalyses
 */
export default defineEventHandler<Promise<ApiResponseI<Array<AnalyseVo.AnalyseOption>>>>(async () => {
  try {
    const analyses = await analyseService.getAnalyses()
    return ApiResponse.success(analyses)
  } catch (e: any) {
    return ApiResponse.error(e.message)
  }
})
