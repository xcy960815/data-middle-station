import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()

export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.GetAnalyzeOptions>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeDto.GetAnalyzeOptions>(event)
    const getAnalyzeResult = await analyzeService.getAnalyze(body)
    return ApiResponse.success(getAnalyzeResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
