import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

export default defineEventHandler<Promise<ApiResponseI<AnalyseVo.AnalyseResponse>>>(async (event) => {
  try {
    const analyseParams = await readBody<AnalyseDto.GetAnalyseRequest>(event)
    const data = await analyseService.getAnalyse(analyseParams)
    return ApiResponse.success(data)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
