import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()

export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.AnalyzeDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeConfigDto.SwitchAnalyzeConfigVersionRequest>(event)
    const result = await analyzeService.switchAnalyzeConfigVersion(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
