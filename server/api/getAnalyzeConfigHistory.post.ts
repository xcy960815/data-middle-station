import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()

export default defineEventHandler<Promise<ApiResponseI<AnalyzeConfigVo.AnalyzeConfigResponse[]>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeConfigDto.GetAnalyzeConfigHistoryRequest>(event)
    const result = await analyzeService.getAnalyzeConfigHistory(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
