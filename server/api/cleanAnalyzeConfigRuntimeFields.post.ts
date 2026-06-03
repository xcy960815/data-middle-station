import { AnalyzeConfigService } from '@/server/service/analyzeConfigService'

const analyzeConfigService = new AnalyzeConfigService()

export default defineEventHandler<Promise<ApiResponseI<AnalyzeConfigVo.CleanRuntimeValidationFieldsResponse>>>(
  async () => {
    try {
      const result = await analyzeConfigService.cleanRuntimeValidationFields()
      return ApiResponse.success(result)
    } catch (error: any) {
      return ApiResponse.error(error.message)
    }
  }
)
