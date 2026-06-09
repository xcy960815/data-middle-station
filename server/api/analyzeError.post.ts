import { sendStream, setResponseHeader } from 'h3'
import { AnalyzeErrorAiService, type AnalyzeErrorAiRequest } from '@/server/service/analyzeErrorAiService'

const analyzeErrorAiService = new AnalyzeErrorAiService()

/**
 * @desc AI 分析错误
 */
export default defineEventHandler(async (event) => {
  const analyzeErrorRequest = await readBody<AnalyzeErrorAiRequest>(event)

  // 设置响应头为流式 NDJSON
  setResponseHeader(event, 'Content-Type', 'application/x-ndjson')
  setResponseHeader(event, 'Transfer-Encoding', 'chunked')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')

  return sendStream(event, analyzeErrorAiService.streamAnalyzeError(analyzeErrorRequest))
})
