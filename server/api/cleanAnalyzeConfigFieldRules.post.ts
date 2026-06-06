import { AnalyzeConfigService } from '@/server/service/analyzeConfigService'

const analyzeConfigService = new AnalyzeConfigService()

export default defineEventHandler<Promise<ApiResponseI<AnalyzeConfigVo.CleanFieldRulesResponse>>>(async () => {
  try {
    const result = await analyzeConfigService.cleanFieldRules()
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
