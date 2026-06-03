import { UserMapper } from '@/server/mapper/userMapper'
import { verifyPassword } from '@/server/utils/password'
import chalk from 'chalk'

const logger = new Logger({
  fileName: 'login',
  folderName: 'api'
})
const userMapper = new UserMapper()
export const AVATAR = 'https://64.media.tumblr.com/d15e5f21577f659a395d84e49f4d75dc/tumblr_oo4411ye0h1si8vfyo1_1280.gif'

function getRealClientIP(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIP = getHeader(event, 'x-real-ip')
  const cfConnectingIP = getHeader(event, 'cf-connecting-ip')
  if (forwarded) return forwarded.split(',')[0]?.trim() || ''
  if (realIP) return realIP
  if (cfConnectingIP) return cfConnectingIP
  const remoteAddress = event.node.req.socket?.remoteAddress || ''
  return remoteAddress.startsWith('::ffff:') ? remoteAddress.substring(7) : remoteAddress
}

async function writeLoginLog(options: Parameters<UserMapper['createLoginLog']>[0]) {
  try {
    await userMapper.createLoginLog(options)
  } catch (error) {
    logger.warn(chalk.yellow(`写入登录日志失败: ${(error as Error).message}`))
  }
}

/**
 * 登录API
 */
export default defineEventHandler<Promise<ApiResponseI<LoginVo.LoginResponse>>>(async (event) => {
  const loginIp = getRealClientIP(event)
  const userAgent = getHeader(event, 'user-agent') || ''
  try {
    // 获取请求体数据
    const loginRequest = await readBody<LoginDto.LoginRequest>(event)
    /**
     * @desc 判断用户名和密码是否为空
     */
    if (!loginRequest.userName || !loginRequest.password) {
      return ApiResponse.error('用户名和密码不能为空')
    }
    const user = await userMapper.getUserForLogin(loginRequest.userName)
    if (!user) {
      logger.warn(chalk.yellow(`用户 ${loginRequest.userName} 登录失败: 用户名或密码错误`))
      await writeLoginLog({
        userName: loginRequest.userName,
        loginIp,
        userAgent,
        status: 'failed',
        failReason: '用户名或密码错误'
      })
      return ApiResponse.error('用户名或密码错误')
    }

    if (user.status !== 1) {
      await writeLoginLog({
        userId: user.id,
        userName: user.userName,
        loginIp,
        userAgent,
        status: 'failed',
        failReason: '用户已禁用'
      })
      return ApiResponse.error('用户已禁用')
    }

    const passwordMatched = await verifyPassword(loginRequest.password, user.passwordHash)
    if (!passwordMatched) {
      await writeLoginLog({
        userId: user.id,
        userName: user.userName,
        loginIp,
        userAgent,
        status: 'failed',
        failReason: '用户名或密码错误'
      })
      return ApiResponse.error('用户名或密码错误')
    }

    const roleCodes = await userMapper.getUserRoleCodes(user.id)
    const token = JwtUtils.generateToken({
      userId: String(user.id),
      userName: user.userName,
      roleCodes
    })

    setCookie(event, JwtUtils.TOKEN_NAME, token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    await Promise.all([
      userMapper.updateLastLogin(user.id, loginIp),
      writeLoginLog({
        userId: user.id,
        userName: user.userName,
        loginIp,
        userAgent,
        status: 'success'
      })
    ])

    return ApiResponse.success({
      userId: String(user.id),
      userName: user.userName
    })
  } catch (error) {
    const err = error as Error
    logger.error(chalk.red(`登录异常: ${err.message}`))
    return ApiResponse.error('服务器内部错误')
  }
})
