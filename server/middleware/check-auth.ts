import { JwtUtils } from '../utils/jwt'
import chalk from 'chalk'

const logger = new Logger({
  fileName: 'auth',
  folderName: 'middleware'
})

// 不需要验证token的路由白名单
const whiteList = ['/api/login', '/api/register']

/**
 * JWT认证中间件
 */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event).toString()

  // 只对/api开头的请求进行权限校验
  if (!url.startsWith('/api')) {
    return
  }

  // 白名单路径不需要验证
  if (whiteList.some((path) => url.startsWith(path))) {
    return
  }

  try {
    // 从请求头获取token
    const token = JwtUtils.getTokenFromHeader(event)

    if (!token) {
      logger.warn(`未提供认证Token: ${url}`)
      return createError({
        statusCode: 401,
        statusMessage: '请先登录',
        data: {
          code: 401,
          message: '未提供认证Token'
        }
      })
    }

    // 验证token
    const payload = JwtUtils.verifyToken(token)

    // 将用户信息添加到请求上下文
    event.context.user = payload

    logger.info(`用户 ${payload.username} 请求: ${url}`)
  } catch (error) {
    const err = error as Error

    logger.error(`认证失败: ${err.message}`)

    return createError({
      statusCode: 401,
      statusMessage: '认证失败',
      data: {
        code: 401,
        message: err.message
      }
    })
  }
})
