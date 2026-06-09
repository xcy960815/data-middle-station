import { UserMapper } from '@/server/mapper/userMapper'
import { verifyPassword } from '@/server/utils/password'
import chalk from 'chalk'

export const DEFAULT_USER_AVATAR =
  'https://64.media.tumblr.com/d15e5f21577f659a395d84e49f4d75dc/tumblr_oo4411ye0h1si8vfyo1_1280.gif'

type LoginLogOptions = Parameters<UserMapper['createLoginLog']>[0]

type AuthSuccessResult = {
  authenticated: true
  token: string
  userId: string
  userName: string
}

type AuthFailureResult = {
  authenticated: false
  errorMessage: string
}

type AuthResult = AuthSuccessResult | AuthFailureResult

/**
 * @desc 认证服务，负责用户登录验证、JWT 签发和登录日志记录。
 */
export class AuthService {
  private userMapper: UserMapper
  private logger: InstanceType<typeof Logger>

  constructor() {
    this.userMapper = new UserMapper()
    this.logger = new Logger({ fileName: 'authService', folderName: 'service' })
  }

  /**
   * 从 HTTP 事件中提取真实客户端 IP，依次检查 x-forwarded-for、x-real-ip、cf-connecting-ip。
   * @param {H3Event} event Nitro 请求事件。
   * @returns {string} 客户端 IP 地址。
   */
  resolveClientIp(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]): string {
    const forwarded = getHeader(event, 'x-forwarded-for')
    const realIP = getHeader(event, 'x-real-ip')
    const cfConnectingIP = getHeader(event, 'cf-connecting-ip')
    if (forwarded) return forwarded.split(',')[0]?.trim() || ''
    if (realIP) return realIP
    if (cfConnectingIP) return cfConnectingIP
    const remoteAddress = event.node.req.socket?.remoteAddress || ''
    return remoteAddress.startsWith('::ffff:') ? remoteAddress.substring(7) : remoteAddress
  }

  /**
   * 执行用户登录认证流程：查找用户 → 校验状态 → 验证密码 → 签发 JWT → 记录登录日志。
   * @param {LoginDto.LoginRequest} loginRequest 登录请求参数。
   * @param {{ loginIp: string; userAgent: string }} context 登录上下文（IP 和 UA）。
   * @returns {Promise<AuthResult>} 认证结果，包含 token 或错误信息。
   */
  async authenticateUser(
    loginRequest: LoginDto.LoginRequest,
    context: { loginIp: string; userAgent: string }
  ): Promise<AuthResult> {
    const { loginIp, userAgent } = context

    if (!loginRequest.userName || !loginRequest.password) {
      return { authenticated: false, errorMessage: '用户名和密码不能为空' }
    }

    const user = await this.userMapper.getUserForLogin(loginRequest.userName)
    if (!user) {
      this.logger.warn(chalk.yellow(`用户 ${loginRequest.userName} 登录失败: 用户名或密码错误`))
      await this.writeLoginLog({
        userName: loginRequest.userName,
        loginIp,
        userAgent,
        status: 'failed',
        failReason: '用户名或密码错误'
      })
      return { authenticated: false, errorMessage: '用户名或密码错误' }
    }

    if (user.status !== 1) {
      await this.writeLoginLog({
        userId: user.id,
        userName: user.userName,
        loginIp,
        userAgent,
        status: 'failed',
        failReason: '用户已禁用'
      })
      return { authenticated: false, errorMessage: '用户已禁用' }
    }

    const passwordMatched = await verifyPassword(loginRequest.password, user.passwordHash)
    if (!passwordMatched) {
      await this.writeLoginLog({
        userId: user.id,
        userName: user.userName,
        loginIp,
        userAgent,
        status: 'failed',
        failReason: '用户名或密码错误'
      })
      return { authenticated: false, errorMessage: '用户名或密码错误' }
    }

    const roleCodes = await this.userMapper.getUserRoleCodes(user.id)
    const token = JwtUtils.generateToken({
      userId: String(user.id),
      userName: user.userName,
      roleCodes
    })

    await Promise.all([
      this.userMapper.updateLastLogin(user.id, loginIp),
      this.writeLoginLog({ userId: user.id, userName: user.userName, loginIp, userAgent, status: 'success' })
    ])

    return {
      authenticated: true,
      token,
      userId: String(user.id),
      userName: user.userName
    }
  }

  /**
   * 安全写入登录日志，失败时仅记录警告不抛出异常。
   * @param {LoginLogOptions} options 登录日志参数。
   * @returns {Promise<void>}
   */
  private async writeLoginLog(options: LoginLogOptions): Promise<void> {
    try {
      await this.userMapper.createLoginLog(options)
    } catch (error) {
      this.logger.warn(chalk.yellow(`写入登录日志失败: ${(error as Error).message}`))
    }
  }
}
