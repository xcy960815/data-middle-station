import { Logger } from '@/server/utils/logger'
import type { EventHandlerRequest, H3Event } from 'h3'

const logger = new Logger({
  fileName: 'log',
  folderName: 'middleware'
})

/**
 * 获取客户端真实 IP 地址
 * 与 `check-auth` 中的实现保持一致，便于维护
 */
function getRealClientIP(event: H3Event<EventHandlerRequest>): string {
  // 优先从代理头中获取真实 IP
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIP = getHeader(event, 'x-real-ip')
  const cfConnectingIP = getHeader(event, 'cf-connecting-ip')

  if (forwarded) {
    // x-forwarded-for 可能包含多个 IP，取第一个
    return forwarded.split(',')[0]?.trim()
  }

  if (realIP) {
    return realIP
  }

  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // 从 Node.js 请求对象中获取远程地址
  const remoteAddress = event.node.req.socket?.remoteAddress
  if (remoteAddress) {
    // 如果是 IPv6 映射的 IPv4 地址，提取 IPv4 部分
    if (remoteAddress.startsWith('::ffff:')) {
      return remoteAddress.substring(7)
    }
    return remoteAddress
  }

  return '未知ip地址'
}

/**
 * @desc API访问日志中间件
 * 记录用户访问API接口的详细信息
 */
export default defineEventHandler((event: H3Event<EventHandlerRequest>) => {
  const { pathname } = getRequestURL(event)
  const method = event.method || 'GET'

  // 只记录 API 接口的访问日志，静态资源等直接跳过
  if (!pathname.startsWith('/api')) {
    return
  }

  const clientIP = getRealClientIP(event)

  try {
    // 尝试从请求头获取 token
    const token = JwtUtils.getTokenFromCookie(event)
    if (token) {
      const payload = JwtUtils.verifyToken(token)
      // 记录已认证用户的访问日志
      logger.info(`用户 ${payload.userName} (ID: ${payload.userId}) 访问接口: ${method} ${pathname} - IP: ${clientIP}`)
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
