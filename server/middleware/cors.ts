/**
 * @desc CORS（跨域）中间件
 * @link https://github.com/nuxt/nuxt/issues/14598
 */

export default defineEventHandler((event) => {
  const requestOrigin = getHeader(event, 'origin') || ''

  const corsHeaders: Record<string, string> = {
    // 允许的请求方法
    'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    // 允许在跨域请求中携带的请求头（可按需收紧）
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    // 允许前端访问的响应头（这里放宽为与 Allow-Headers 一致）
    'Access-Control-Expose-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    // 预检请求结果缓存时间（秒）
    'Access-Control-Max-Age': '86400',
    // 允许携带 Cookie 等凭证
    'Access-Control-Allow-Credentials': 'true'
  }

  if (requestOrigin) {
    // 按规范，携带凭证时不能使用通配符，需要回写具体 Origin
    corsHeaders['Access-Control-Allow-Origin'] = requestOrigin
    corsHeaders['Vary'] = 'Origin'
  } else {
    // 非浏览器请求或没有 Origin 时，退回为全量允许
    corsHeaders['Access-Control-Allow-Origin'] = '*'
  }

  setResponseHeaders(event, corsHeaders)

  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204, 'No Content')
    return 'OK'
  }
})
