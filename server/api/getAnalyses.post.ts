import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

export default defineEventHandler<Promise<ApiResponse<Array<AnalyseVo.AnalyseOption>>>>(async () => {
  try {
    const analyses = await analyseService.getAnalyses()
    return CustomResponse.success(analyses)
  } catch (e: any) {
    return CustomResponse.error(e.message)
  }
})
