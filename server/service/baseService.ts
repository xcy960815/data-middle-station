import dayjs from 'dayjs'
import type { JwtPayload } from '@/server/utils/jwt'
import { getCurrentRequestEvent } from '@/server/utils/request-context'

/**
 * @class BaseService
 * @description 基础服务类，提供获取当前用户、角色/权限校验、获取默认审计数据（创建/更新人、创建/更新时间）等通用服务方法。
 */
export class BaseService {
  /**
   * 获取当前请求中间件解析出的用户信息
   * @protected
   * @returns {JwtPayload | undefined} 当前登录用户的 JWT 载荷，若未登录或无请求上下文则返回 undefined
   */
  protected getCurrentUser(): JwtPayload | undefined {
    return getCurrentRequestEvent()?.context.user
  }

  /**
   * 校验当前用户是否拥有指定的任一角色
   * @protected
   * @param {string[]} allowedRoleCodes 允许访问的角色编码列表
   * @param {string} [message='无权访问该功能'] 校验失败时的错误提示信息
   * @throws {Error} 未登录（未获取到当前用户信息）或不具备任何指定角色时抛出异常
   * @returns {void}
   */
  protected assertCurrentUserRole(allowedRoleCodes: string[], message = '无权访问该功能'): void {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('未获取到当前用户信息')
    }
    const roleCodes = currentUser.roleCodes || []
    if (!allowedRoleCodes.some((roleCode) => roleCodes.includes(roleCode))) {
      throw new Error(message)
    }
  }

  /**
   * 校验当前用户是否为管理员角色
   * @protected
   * @param {string} [message='仅管理员可访问该功能'] 校验失败时的错误提示信息
   * @throws {Error} 用户非管理员角色或未登录时抛出异常
   * @returns {void}
   */
  protected assertCurrentUserAdmin(message = '仅管理员可访问该功能'): void {
    this.assertCurrentUserRole(['admin'], message)
  }

  /**
   * 获取默认审计信息，包含创建人、更新人、创建时间和更新时间
   * @protected
   * @returns {Promise<{createdBy: string, updatedBy: string, createTime: string, updateTime: string}>} 包含审计信息的 Promise 对象
   */
  protected async getDefaultInfo() {
    const currentUser = this.getCurrentUser()
    const operator = currentUser?.userName || 'system'
    const createdBy = operator
    const updatedBy = operator
    const createTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return { createdBy, updatedBy, createTime, updateTime }
  }
}
