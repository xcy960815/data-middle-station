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
   * @desc 获取默认信息
   * @returns {Promise<{createdBy: string, updatedBy: string, createTime: string, updateTime: string}>}
   */
  protected async getDefaultInfo() {
    const currentUser = this.getCurrentUser()
    const fallbackUserName = (await RedisStorage.getItem<string>(`userName`)) || 'system'
    const createdBy = currentUser?.userName || fallbackUserName
    const updatedBy = currentUser?.userName || fallbackUserName
    const createTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return { createdBy, updatedBy, createTime, updateTime }
  }
}
