import { getAnalyzeAlarmService } from '@/server/service/analyzeAlarmService'

/**
 * @desc API 处理器 - analyze/alarm/list.post.ts (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
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
