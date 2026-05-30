import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()

export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.AnalyzeDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeDto.GetAnalyzeRequest>(event)
    const getAnalyzeResult = await analyzeService.getAnalyze(body)
    return ApiResponse.success(getAnalyzeResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
