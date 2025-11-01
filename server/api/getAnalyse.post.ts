import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

export default defineEventHandler<Promise<ApiResponseI<AnalyseVo.GetAnalyseResponse>>>(async (event) => {
  try {
    const getAnalyseRequest = await readBody<AnalyseDto.GetAnalyseRequest>(event)
    const getAnalyseResult = await analyseService.getAnalyse(getAnalyseRequest)
    return ApiResponse.success(getAnalyseResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
