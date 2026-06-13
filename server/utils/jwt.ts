import { Logger } from '@/server/utils/logger'
import type { EventHandlerRequest, H3Event } from 'h3'
import type { Secret, SignOptions } from 'jsonwebtoken'
import pkg from 'jsonwebtoken'
const { sign, verify, TokenExpiredError, JsonWebTokenError } = pkg

const logger = new Logger({
  fileName: 'jwt',
  folderName: 'auth'
})

export interface JwtPayload {
  userId: string
  userName: string
  roleCodes?: string[]
  exp?: number // JWT标准字段，表示过期时间戳（单位：秒）
  iat?: number // JWT标准字段，表示签发时间戳（单位：秒）
}

/**
 * JWT 工具类，提供 Token 签发、验证、生命周期校验及从 Cookie 获取 Token 等功能
 */
export class JwtUtils {
  /**
   * Token 存储于 Cookie 的名称
   * @type {string}
   */
  public static readonly TOKEN_NAME: string = 'BearToken'

  /**
   * 签名/验证密钥，从 runtimeConfig 获取
   * @type {string}
   * @private
   */
  private static readonly SECRET_KEY: string = useRuntimeConfig().jwtSecretKey

  /**
   * 获取签名/验证使用的密钥，转换为 Buffer 类型以方便维护
   * @returns {Secret} 密钥 Buffer
   * @private
   */
  private static getSecretKey(): Secret {
    // 统一在这里将密钥转换为 Buffer，便于后续维护
    return Buffer.from(String(this.SECRET_KEY))
  }

  /**
   * Token 过期时间（例如 "24h"）
   * @private
   */
  private static readonly JWT_EXPIRES_IN = useRuntimeConfig().jwtExpiresIn

  /**
   * 生成新的 JWT Token
   * @param {JwtPayload} payload 载荷数据，包含用户信息
   * @returns {string} 生成的 Token 字符串
   * @throws {Error} 当生成失败时抛出异常
   */
  public static generateToken(payload: JwtPayload): string {
    try {
      // 配置签名选项
      const options: SignOptions = {
        expiresIn: this.JWT_EXPIRES_IN as SignOptions['expiresIn']
      }
      return sign(payload, this.getSecretKey(), options)
    } catch (error) {
      logger.error(`生成token失败: ${(error as Error).message}`)
      throw new Error('Token生成失败')
    }
  }

  /**
   * 验证并解析 JWT Token
   * @param {string} token 待验证的 Token 字符串
   * @returns {JwtPayload} 解析后的 Payload 载荷数据
   * @throws {TokenExpiredError} 当 Token 已过期时抛出
   * @throws {JsonWebTokenError} 当 Token 无效时抛出
   * @throws {Error} 当验证失败时抛出通用异常
   */
  public static verifyToken(token: string): JwtPayload {
    try {
      // 使用统一的密钥获取方式进行验证
      return verify(token, this.getSecretKey()) as JwtPayload
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
   * 从请求上下文中获取 Cookie 里的 Token
   * @param {H3Event<EventHandlerRequest>} event H3 请求事件对象
   * @returns {string | null} 找到的 Token 字符串，或 null
   */
  public static getTokenFromCookie(event: H3Event<EventHandlerRequest>): string | null {
    return getCookie(event, this.TOKEN_NAME) || null
  }

  /**
   * 校验 Token 载荷是否已过期
   * @description 这里直接使用已解析的 payload，避免重复解析 token
   * @param {JwtPayload} payload 已解析的 JWT 载荷数据
   * @returns {boolean} 如果已过期返回 true，否则返回 false
   */
  public static checkTokenExpired(payload: JwtPayload): boolean {
    // 没有 exp 字段，视为不过期（由业务自行控制）
    if (!payload.exp) {
      return false
    }
    const now = Date.now()
    const expiredTime = payload.exp * 1000
    return now >= expiredTime
  }
}
