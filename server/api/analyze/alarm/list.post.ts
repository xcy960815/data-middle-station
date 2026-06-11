import { getAnalyzeAlarmService } from '@/server/service/analyzeAlarmService'

export default defineEventHandler<Promise<ApiResponseI<AnalyzeAlarmDao.AnalyzeAlarmRecord[]>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeAlarmDto.GetAlarmsRequest>(event)
    if (!body.analyzeId) {
      throw new Error('缺少图表 ID')
    }
    const list = await getAnalyzeAlarmService().getAlarms({ analyzeId: body.analyzeId })
    return ApiResponse.success(list)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
