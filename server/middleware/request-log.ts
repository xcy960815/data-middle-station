import { Logger } from '../utils/logger'
import type { H3Event, EventHandlerRequest } from 'h3'

const logger = new Logger({
  fileName: 'log',
  folderName: 'middleware'
})

/**
 * 获取客户端真实IP地址
 * @param event H3事件对象
 * @returns 客户端IP地址
 */
function getRealClientIP(event: H3Event<EventHandlerRequest>): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIP = getHeader(event, 'x-real-ip')
  const cfConnectingIP = getHeader(event, 'cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (cfConnectingIP) {
    return cfConnectingIP
  }

  const nodeReq = event.node.req
  const remoteAddress = nodeReq.socket?.remoteAddress

  if (remoteAddress) {
    if (remoteAddress.startsWith('::ffff:')) {
      return remoteAddress.substring(7)
    }
    return remoteAddress
  }

  return 'unknown'
}

/**
 * @desc API访问日志中间件
 * 记录用户访问API接口的详细信息
 */
export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  const url = getRequestURL(event)
  const pathname = url.pathname
  const method = event.method || 'GET'
  const clientIP = getRealClientIP(event)

  // 只记录 API 接口的访问日志
  if (!pathname.startsWith('/api')) {
    return
  }

  try {
    // 尝试从请求头获取 token
    const token = JwtUtils.getTokenFromCookie(event)
    if (token) {
      const payload = JwtUtils.verifyToken(token)
      // 记录已认证用户的访问日志
      logger.info(`用户 ${payload.username} (ID: ${payload.userId}) 访问接口: ${method} ${pathname} - IP: ${clientIP}`)
    } else {
      // 没有 token，记录匿名访问
      // logger.info(
      //   `匿名用户 访问接口: ${method} ${pathname} - IP: ${clientIP}`
      // )
    }
  } catch (error) {
    // 发生其他错误时的兜底日志
    logger.error(`访问接口: ${method} ${pathname} - IP: ${clientIP} (日志记录异常: ${(error as Error).message})`)
  }
})
