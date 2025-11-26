import type { EventHandlerRequest, H3Event } from 'h3'
import pkg from 'jsonwebtoken'
import { RequestCodeEnum } from '~/utils/request-enmu'

const { TokenExpiredError, JsonWebTokenError } = pkg

// 创建认证中间件专用的日志实例
const logger = new Logger({
  fileName: 'check-auth',
  folderName: 'middleware'
})

/**
 * 不需要验证 token 的路由白名单（精确匹配或前缀匹配）
 */
const WHITE_LIST: readonly string[] = [
  '/api/login',
  '/api/register',
  '/api/health',
  '/api/public',
  '/api/seedBigData',
  '/api/sendEmail'
]

/**
 * 检查路径是否在白名单中
 */
function isWhitelisted(pathname: string): boolean {
  return WHITE_LIST.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

/**
 * 获取客户端真实 IP 地址
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
 * 构造统一的认证错误
 */
function createAuthError(statusCode: number, message: string) {
  return createError({
    statusCode,
    message,
    statusText: message,
    statusMessage: message
  })
}

/**
 * JWT认证中间件
 * 对所有 /api 开头的请求进行权限校验（白名单除外）
 */
export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  const url = getRequestURL(event)
  const pathname = url.pathname
  const method = event.method || 'GET'
  const clientIP = getRealClientIP(event)
  // 只对 /api 开头的请求进行权限校验
  if (!pathname.startsWith('/api')) {
    return
  }

  // 白名单路径不需要验证
  if (isWhitelisted(pathname)) {
    logger.info(`白名单路径访问: ${method} ${pathname} - IP: ${clientIP}`)
    return
  }
  try {
    // 从 Cookie / Header 获取 token
    const token = JwtUtils.getTokenFromCookie(event)
    if (!token) {
      logger.warn(`${'未提供认证Token'}: ${method} ${pathname} - IP: ${clientIP}`)
      // 返回 401 错误而不是重定向
      return createAuthError(RequestCodeEnum.Unauthorized, '未提供认证Token')
    }
    // 验证 token
    const payload = JwtUtils.verifyToken(token)
    /**
     * @desc 校验token是否过期（基于已解析的 payload，避免重复解析 token）
     */
    if (JwtUtils.checkTokenExpired(payload)) {
      logger.warn(`token已过期: ${method} ${pathname} - IP: ${clientIP}`)
      // 返回 401 错误而不是重定向
      return createAuthError(RequestCodeEnum.Unauthorized, 'token已过期')
    }
    // 记录成功的认证日志
    logger.info(`认证成功: ${payload.userName} (ID: ${payload.userId}) ${method} ${pathname} - IP: ${clientIP}`)
  } catch (error) {
    let errorMsg: string
    if (error instanceof TokenExpiredError) {
      errorMsg = `token已过期: ${error.message}`
    } else if (error instanceof JsonWebTokenError) {
      errorMsg = `token验证失败: ${error.message}`
    } else {
      errorMsg = `认证失败: ${error}`
    }
    logger.error(`${errorMsg} - ${method} ${pathname} - IP: ${clientIP}`)
    return createAuthError(RequestCodeEnum.Unauthorized, errorMsg)
  }
})
