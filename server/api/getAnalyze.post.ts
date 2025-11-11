import { AnalyzeService } from '../service/analyzeService'

const analyzeService = new AnalyzeService()

export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.GetAnalyzeResponse>>>(async (event) => {
  try {
    const getAnalyzeRequest = await readBody<AnalyzeDto.GetAnalyzeRequest>(event)
    const getAnalyzeResult = await analyzeService.getAnalyze(getAnalyzeRequest)
    return ApiResponse.success(getAnalyzeResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
