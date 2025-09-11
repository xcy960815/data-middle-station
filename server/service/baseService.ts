import dayjs from 'dayjs'

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
