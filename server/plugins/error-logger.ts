/**
 * @desc 全局错误日志插件
 *       通过 Nitro hooks 在接口处理完成后统一记录错误状态码和请求信息
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, context) => {
    const event = context?.event
    if (!event) return
    try {
      const url = getRequestURL(event)
      const pathname = url.pathname
      const method = event.method || event.node.req.method || 'GET'

      // 只关心 /api 开头的接口错误
      if (!pathname.startsWith('/api')) return

      // 状态码优先取响应上的，其次尝试从错误对象中推断
      const statusFromRes = event.node.res.statusCode
      const statusFromError =
        typeof (error as { statusCode?: number }).statusCode === 'number'
          ? (error as { statusCode?: number }).statusCode
          : undefined
      const statusCode = statusFromRes || statusFromError || 500

      let message = 'Unknown error'
      if (error instanceof Error) {
        message = error.message || message
      } else if (typeof error === 'string') {
        message = error
      } else if (error && typeof (error as { toString: () => string }).toString === 'function') {
        message = (error as { toString: () => string }).toString()
      }

      const logger = new Logger({ fileName: 'error-logger', folderName: 'middleware' })
      logger.error(`[API ERROR] ${method} ${pathname} - status=${statusCode} message=${message}`)
    } catch (_e) {
      // 避免日志插件本身抛错影响正常响应
    }
  })
})
