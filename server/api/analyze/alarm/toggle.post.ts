import { getAnalyzeAlarmService } from '@/server/service/analyzeAlarmService'

/**
 * @desc API 处理器 - analyze/alarm/toggle.post.ts (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeAlarmDto.AlarmIdRequest>(event)
    if (!body.id) {
      throw new Error('缺少报警规则 ID')
    }
    const success = await getAnalyzeAlarmService().toggleAlarmStatus(body.id)
    return ApiResponse.success(success)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
