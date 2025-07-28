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
export default defineEventHandler<Promise<ApiResponse<Array<AnalyseVo.AnalyseOption>>>>(async () => {
  try {
    const analyses = await analyseService.getAnalyses()
    return CustomResponse.success(analyses)
  } catch (e: any) {
    return CustomResponse.error(e.message)
  }
})
