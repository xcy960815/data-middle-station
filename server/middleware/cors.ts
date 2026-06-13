/**
 * @desc CORS（跨域）中间件
 * @link https://github.com/nuxt/nuxt/issues/14598
 */

/**
 * CORS 处理中间件事件处理器
 * @param {H3Event} event H3 事件对象
 * @returns {string | undefined} 返回响应状态内容或无返回值
 */
export default defineEventHandler((event) => {
  const requestOrigin = getHeader(event, 'origin') || ''
  const requestUrl = getRequestURL(event)
  const forwardedHost = getHeader(event, 'x-forwarded-host')
  const forwardedProto = getHeader(event, 'x-forwarded-proto')
  const requestHost = forwardedHost || getHeader(event, 'host') || requestUrl.host
  const requestProto = forwardedProto || requestUrl.protocol.replace(':', '')
  const sameOrigin = requestHost ? `${requestProto}://${requestHost}` : requestUrl.origin
  const allowedOrigins = String(useRuntimeConfig().corsAllowedOrigins || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  const isAllowedOrigin = requestOrigin && (requestOrigin === sameOrigin || allowedOrigins.includes(requestOrigin))

  const corsHeaders: Record<string, string> = {
    // 允许的请求方法
    'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    // 允许在跨域请求中携带的请求头（可按需收紧）
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    // 允许前端访问的响应头（这里放宽为与 Allow-Headers 一致）
    'Access-Control-Expose-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    // 预检请求结果缓存时间（秒）
    'Access-Control-Max-Age': '86400'
  }

  if (isAllowedOrigin) {
    // 按规范，携带凭证时不能使用通配符，需要回写具体 Origin
    corsHeaders['Access-Control-Allow-Origin'] = requestOrigin
    // 允许携带 Cookie 等凭证
    corsHeaders['Access-Control-Allow-Credentials'] = 'true'
    corsHeaders['Vary'] = 'Origin'
  }

  setResponseHeaders(event, corsHeaders)

  if (event.method === 'OPTIONS') {
    if (requestOrigin && !isAllowedOrigin) {
      setResponseStatus(event, 403, 'Forbidden')
      return 'Forbidden'
    }
    setResponseStatus(event, 204, 'No Content')
    return 'OK'
  }
})
