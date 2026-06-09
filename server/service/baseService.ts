import dayjs from 'dayjs'
import type { JwtPayload } from '@/server/utils/jwt'
import { getCurrentRequestEvent } from '@/server/utils/request-context'

/**
 * 基础的service 提供了创建时间、更新时间、创建人、更新人等信息
 */
export class BaseService {
  /**
   * @desc 获取当前请求中间件解析出的用户信息。
   */
  protected getCurrentUser(): JwtPayload | undefined {
    return getCurrentRequestEvent()?.context.user
  }

  /**
   * @desc 校验当前用户是否拥有任一指定角色。
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
   * @desc 校验当前用户是否为管理员。
   */
  protected assertCurrentUserAdmin(message = '仅管理员可访问该功能'): void {
    this.assertCurrentUserRole(['admin'], message)
  }

  /**
   * @desc 获取默认信息
   * @returns {Promise<{createdBy: string, updatedBy: string, createTime: string, updateTime: string}>}
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
