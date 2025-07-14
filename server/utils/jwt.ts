import pkg from 'jsonwebtoken'
const {
  sign,
  verify,
  TokenExpiredError,
  JsonWebTokenError
} = pkg
import type { Secret } from 'jsonwebtoken'
import chalk from 'chalk'
import type { H3Event, EventHandlerRequest } from 'h3'
import { Logger } from './logger'

const logger = new Logger({
  fileName: 'jwt',
  folderName: 'auth'
})

interface JwtPayload {
  userId: string | number
  username: string
}
console.log(
  'TokenExpiredError--TokenExpiredError',
  TokenExpiredError
)

/**
 * JWT工具类
 */
export class JwtUtils {
  /**
   * 密钥
   */
  private static readonly SECRET_KEY =
    useRuntimeConfig().jwtSecretKey

  /**
   * token过期时间（默认24小时）
   */
  private static readonly EXPIRES_IN = Number(
    useRuntimeConfig().jwtExpiresIn
  )

  /**
   * 生成token
   * @param payload 载荷数据
   * @returns token字符串
   */
  public static generateToken(payload: JwtPayload): string {
    try {
      // 将密钥转换为Buffer类型
      const secretKey: Secret = Buffer.from(
        String(this.SECRET_KEY)
      )

      // 使用any类型断言解决类型问题
      const options = {
        expiresIn: this.EXPIRES_IN
      }
      const token = sign(payload, secretKey, options)
      logger.info(`生成token成功: ${payload.username}`)
      return token
    } catch (error) {
      logger.error(
        `生成token失败: ${(error as Error).message}`
      )
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
      const secretKey: Secret = Buffer.from(
        String(this.SECRET_KEY)
      )
      const decoded = verify(token, secretKey) as JwtPayload
      return decoded
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        logger.warn(`token已过期: ${error.message}`)
        throw new Error('Token已过期')
      } else if (error instanceof JsonWebTokenError) {
        logger.error(`token验证失败: ${error.message}`)
        throw new Error('Token无效')
      } else {
        // logger.error(`token验证失败: ${error.message}`)
        throw new Error('Token验证失败')
      }
    }
  }

  /**
   * 从请求头中获取token
   * @param event H3事件对象
   * @returns token字符串或null
   */
  public static getTokenFromHeader(
    event: H3Event<EventHandlerRequest>
  ): string | null {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return null
    return authHeader.substring(7) // 去掉'Bearer '前缀
  }
}
