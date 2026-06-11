import { getAnalyzeAlarmService } from '@/server/service/analyzeAlarmService'

export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeAlarmDto.UpdateAlarmRequest>(event)
    if (!body.id) {
      throw new Error('缺少报警规则 ID')
    }
    const success = await getAnalyzeAlarmService().updateAlarm(body)
    return ApiResponse.success(success)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
