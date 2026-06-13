import { getAnalyzeAlarmService } from '@/server/service/analyzeAlarmService'

/**
 * @desc API 处理器 - analyze/alarm/create.post.ts (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<{ id: number }>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeAlarmDto.CreateAlarmRequest>(event)
    if (!body.analyzeId || !body.alarmName || !body.cronExpression || !body.conditions) {
      throw new Error('缺少必要参数')
    }
    const id = await getAnalyzeAlarmService().createAlarm(body)
    return ApiResponse.success({ id })
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
