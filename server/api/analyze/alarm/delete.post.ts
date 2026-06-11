import { getAnalyzeAlarmService } from '@/server/service/analyzeAlarmService'
import { removeAlarmJob } from '@/server/plugins/analyze-alarm-scheduler'

export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeAlarmDto.AlarmIdRequest>(event)
    if (!body.id) {
      throw new Error('缺少报警规则 ID')
    }
    const success = await getAnalyzeAlarmService().deleteAlarm(body.id)
    if (success) {
      removeAlarmJob(body.id)
    }
    return ApiResponse.success(success)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
