import { AnalyzeConfigService } from '@/server/service/analyzeConfigService'

const analyzeConfigService = new AnalyzeConfigService()

export default defineEventHandler<Promise<ApiResponseI<AnalyzeConfigVo.CleanTableColumnUiFieldsResponse>>>(async () => {
  try {
    const result = await analyzeConfigService.cleanTableColumnUiFields()
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
