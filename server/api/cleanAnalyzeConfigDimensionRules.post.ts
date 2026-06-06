import { AnalyzeConfigService } from '@/server/service/analyzeConfigService'

const analyzeConfigService = new AnalyzeConfigService()

type CleanAnalyzeConfigDimensionRulesRequest = {
  analyzeId?: number
  configId?: number
  defaultEnabled?: boolean
  enabledAnalyzeIds?: number[]
}

export default defineEventHandler<Promise<ApiResponseI<AnalyzeConfigVo.CleanDimensionRulesResponse>>>(async (event) => {
  try {
    const body = await readBody<CleanAnalyzeConfigDimensionRulesRequest>(event)
    const result = await analyzeConfigService.cleanDimensionRules({
      analyzeId: body.analyzeId ? Number(body.analyzeId) : undefined,
      configId: body.configId ? Number(body.configId) : undefined,
      defaultEnabled: typeof body.defaultEnabled === 'boolean' ? body.defaultEnabled : undefined,
      enabledAnalyzeIds: Array.isArray(body.enabledAnalyzeIds) ? body.enabledAnalyzeIds.map(Number) : undefined
    })
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
