import pkg from 'jsonwebtoken'
const { sign, verify, TokenExpiredError, JsonWebTokenError } = pkg
import type { Secret, SignOptions } from 'jsonwebtoken'
import type { H3Event, EventHandlerRequest } from 'h3'
import { Logger } from './logger'

const logger = new Logger({
  fileName: 'jwt',
  folderName: 'auth'
})

export interface JwtPayload {
  userId: string
  username: string
  exp?: number // JWT标准字段，表示过期时间戳（单位：秒）
  iat?: number // JWT标准字段，表示签发时间戳（单位：秒）
}

/**
 * JWT工具类
 */
export class JwtUtils {
  /**
   * token 名称
   */
  public static readonly TOKEN_NAME: string = 'BearToken'

  /**
   * 密钥
   */
  private static readonly SECRET_KEY: string = useRuntimeConfig().jwtSecretKey

  /**
   * token过期时间（默认24小时）
   */
  private static readonly JWT_EXPIRES_IN = useRuntimeConfig().jwtExpiresIn

  /**
   * 生成token
   * @param payload 载荷数据
   * @returns token字符串
   */
  public static generateToken(payload: JwtPayload): string {
    try {
      // 将密钥转换为Buffer类型
      const secretKey: Secret = Buffer.from(String(this.SECRET_KEY))

      // 配置签名选项
      const options: SignOptions = {
        expiresIn: this.JWT_EXPIRES_IN as SignOptions['expiresIn']
      }
      return sign(payload, secretKey, options)
    } catch (error) {
      logger.error(`生成token失败: ${(error as Error).message}`)
      throw new Error('Token生成失败')
    }
  }

  /**
   * 验证token
   * @param token token字符串
   * @returns 解析后的payload数据
   */
  public static verifyToken(token: string): JwtPayload {
    try {
      // 将密钥转换为Buffer类型
      const secretKey: Secret = Buffer.from(String(this.SECRET_KEY))
      return verify(token, secretKey) as JwtPayload
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        logger.warn(`token已过期: ${error.message}`)
        throw new TokenExpiredError('Token已过期', new Date())
      } else if (error instanceof JsonWebTokenError) {
        logger.error(`token验证失败: ${error.message}`)
        throw new JsonWebTokenError('Token无效')
      } else {
        throw new Error('Token验证失败')
      }
    }
  }

  /**
   * 从请求头中获取token
   * @param event H3事件对象
   * @returns token字符串或null
   */
  public static getTokenFromCookie(event: H3Event<EventHandlerRequest>): string | null {
    return getCookie(event, this.TOKEN_NAME) || null
  }

  /**
   * @校验token过期时间
   */
  public static checkTokenExpired(token: string): boolean {
    const payload = this.verifyToken(token)
    const now = Date.now()
    const expiredTime = (payload.exp || 0) * 1000
    return now > expiredTime
  }
}
