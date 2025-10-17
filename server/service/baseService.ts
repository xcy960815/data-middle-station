import dayjs from 'dayjs'

/**
 * 基础的service 提供了创建时间、更新时间、创建人、更新人等信息
 */
export class BaseService {
  /**
   * @desc 获取默认信息
   * @returns {Promise<{createdBy: string, updatedBy: string, createTime: string, updateTime: string}>}
   */
  protected async getDefaultInfo() {
    const createdBy = (await RedisStorage.getItem<string>(`userName`)) || 'system'
    const updatedBy = (await RedisStorage.getItem<string>(`userName`)) || 'system'
    const createTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return { createdBy, updatedBy, createTime, updateTime }
  }
}
