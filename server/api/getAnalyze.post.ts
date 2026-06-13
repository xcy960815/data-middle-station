import { AnalyzeService } from '@/server/service/analyzeService'

const analyzeService = new AnalyzeService()

/**
 * @desc 获取分析详情 API 处理器 (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<AnalyzeVo.AnalyzeDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<AnalyzeDto.GetAnalyzeRequest>(event)
    const getAnalyzeResult = await analyzeService.getAnalyze(body)
    return ApiResponse.success(getAnalyzeResult)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
