import { JwtUtils } from '../utils/jwt'
import { Logger } from '../utils/logger'
import { RequestCodeEnum } from '~/utils/request-enmu'
import type { H3Event, EventHandlerRequest } from 'h3'
import dayjs from 'dayjs'
import { navigateTo } from 'nuxt/app'

// 创建认证中间件专用的日志实例
const logger = new Logger({
  fileName: 'auth',
  folderName: 'middleware'
})

/**
 * 认证错误响应接口
 */
interface AuthErrorResponse {
  code: RequestCodeEnum
  message: string
  timestamp: string
  path: string
}

/**
 * 不需要验证token的路由白名单
 * 支持精确匹配和前缀匹配
 */
const whiteList = [
  '/api/login',
  '/api/register',
  '/api/health',
  '/api/public'
]

/**
 * 检查路径是否在白名单中
 * @param url 请求URL路径
 * @returns 是否在白名单中
 */
function isWhitelisted(url: string): boolean {
  return whiteList.some((path) => {
    // 支持精确匹配和前缀匹配
    return url === path || url.startsWith(`${path}/`)
  })
}

/**
 * 创建统一的认证错误响应
 * @param code 错误码
 * @param message 错误消息
 * @param path 请求路径
 * @returns 错误响应对象
 */
function createAuthError(
  code: RequestCodeEnum,
  message: string,
  path: string
): AuthErrorResponse {
  return {
    code,
    message,
    timestamp: dayjs().format(),
    path
  }
}

/**
 * 获取客户端真实IP地址
 * @param event H3事件对象
 * @returns 客户端IP地址
 */
function getRealClientIP(
  event: H3Event<EventHandlerRequest>
): string {
  // 优先从代理头中获取真实IP
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIP = getHeader(event, 'x-real-ip')
  const cfConnectingIP = getHeader(
    event,
    'cf-connecting-ip'
  ) // Cloudflare

  if (forwarded) {
    // x-forwarded-for 可能包含多个IP，取第一个
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // 从 Node.js 请求对象中获取远程地址
  const nodeReq = event.node.req
  const remoteAddress = nodeReq.socket?.remoteAddress

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
 * JWT认证中间件
 * 对所有 /api 开头的请求进行权限校验（白名单除外）
 */
export default defineEventHandler(
  async (event: H3Event<EventHandlerRequest>) => {
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
      logger.info(
        `白名单路径访问: ${method} ${pathname} - IP: ${clientIP}`
      )
      return
    }

    try {
      // 从请求头获取token
      const token = getCookie(event, 'token')
      if (!token) {
        const errorMsg = '未提供认证Token'
        logger.warn(
          `${errorMsg}: ${method} ${pathname} - IP: ${clientIP}`
        )
        navigateTo('/welcome')
        return
      }
      // 验证token
      const payload = JwtUtils.verifyToken(token)

      // 记录成功的认证日志
      logger.info(
        `认证成功: ${payload.username} (ID: ${payload.userId}) ${method} ${pathname} - IP: ${clientIP}`
      )
    } catch (error) {
      // 如果已经是 H3Error，直接抛出
      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error
      ) {
        throw error
      }

      // 处理其他类型的错误
      const err = error as Error
      const errorMsg = err.message || '认证失败'

      logger.error(
        `认证失败: ${errorMsg} - ${method} ${pathname} - IP: ${clientIP}`
      )

      throw createError({
        statusCode: RequestCodeEnum.Unauthorized,
        message: '认证失败',
        data: createAuthError(
          RequestCodeEnum.Unauthorized,
          errorMsg,
          pathname
        )
      })
    }
  }
)
