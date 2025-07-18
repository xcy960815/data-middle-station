/**
 * redis 存储工具类
 */

export class RedisStorage {
  /**
   * 驱动名称
   */
  public static readonly REDIS_DRIVER = 'redis'

  /**
   * 获取键
   * @param key 键
   * @returns 键
   */
  public static getKey(key: string) {
    return `${this.REDIS_DRIVER}:${key}`
  }
  /**
   * 获取键
   * @param key 键
   * @returns 键
   */
  public static getItem(key: string) {
    const storage = useStorage()

    return storage.getItem(this.getKey(key))
  }

  /**
   * 设置键
   * @param key 键
   * @param value 值
   * @param ttl 过期时间
   */
  public static setItem(key: string, value: string, ttl: number = 60_000) {
    const storage = useStorage()
    return storage.setItem(this.getKey(key), value, { ttl })
  }

  /**
   * 删除键
   * @param key 键
   */
  public static removeItem(key: string) {
    const storage = useStorage()
    return storage.removeItem(this.getKey(key))
  }
}
