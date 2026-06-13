import { UserMapper } from '@/server/mapper/userMapper'
import { verifyPassword } from '@/server/utils/password'
import chalk from 'chalk'

/**
 * 默认的用户头像链接
 * @type {string}
 */
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
 * @class AuthService
 * @description 身份认证服务类，负责处理用户登录验证、签发 JWT 访问令牌、从请求中提取客户端 IP，以及安全地记录登录日志。
 */
export class AuthService {
  /**
   * 用户数据访问映射器
   * @private
   * @type {UserMapper}
   */
  private userMapper: UserMapper

  /**
   * 服务日志记录器
   * @private
   * @type {InstanceType<typeof Logger>}
   */
  private logger: InstanceType<typeof Logger>

  /**
   * 构造函数，初始化 UserMapper 与 Logger
   */
  constructor() {
    this.userMapper = new UserMapper()
    this.logger = new Logger({ fileName: 'authService', folderName: 'service' })
  }

  /**
   * 从 HTTP 事件请求头中解析提取真实的客户端 IP 地址。
   * 依次检查 x-forwarded-for, x-real-ip, cf-connecting-ip，并对本地环回 IPv6 映射做降级处理。
   * @public
   * @param {Parameters<Parameters<typeof defineEventHandler>[0]>[0]} event Nitro 请求事件对象
   * @returns {string} 解析出的真实客户端 IP 地址
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
   * 执行用户登录的完整认证流程。
   * 包含用户名校验、用户状态检测、密码哈希比对、查询角色编码列表、签发 JWT 访问令牌并异步更新最后登录时间、记录登录日志。
   * @public
   * @param {LoginDto.LoginRequest} loginRequest 用户的登录请求信息，包含用户名和密码
   * @param {{ loginIp: string; userAgent: string }} context 登录客户端的 IP 地址和浏览器代理 UserAgent
   * @returns {Promise<AuthResult>} 返回认证结果。成功返回带令牌和用户信息的对象，失败返回认证失败原因
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
   * 安全地创建并写入用户登录日志，屏蔽执行期间的所有异常，防止其阻断主登录流。
   * @private
   * @param {LoginLogOptions} options 创建登录日志所需的参数对象
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
