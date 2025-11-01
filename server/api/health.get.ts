/**
 * @desc 健康检查
 * @returns {Promise<ApiResponseI<{status: string, timestamp: string, uptime: number}>>}
 */
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
})
