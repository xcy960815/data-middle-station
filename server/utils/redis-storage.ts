/**
 * Redis 缓存与存储封装工具类
 */
export class RedisStorage {
  /**
   * Redis 驱动在 unstorage 中的挂载名称
   * @type {string}
   */
  public static readonly REDIS_DRIVER = 'dms_redis'

  /**
   * 将普通键名拼接成带驱动前缀的完整 Redis 键名
   * @param {string} key 原始键名
   * @returns {string} 完整的缓存键名
   */
  public static getKey(key: string) {
    return `${this.REDIS_DRIVER}:${key}`
  }

  /**
   * 从 Redis 中获取指定键的数据值
   * @template T
   * @param {string} key 缓存键名
   * @returns {Promise<T | null>} 获取到的数据值，不存在时返回 null
   */
  public static async getItem<T>(key: string): Promise<T | null> {
    const storage = useStorage()
    return await storage.getItem<T>(this.getKey(key))
  }

  /**
   * 向 Redis 写入键值对，并设置生存时间（TTL）
   * @param {string} key 缓存键名
   * @param {string} value 缓存字符串值
   * @param {number} [ttl=60000] 生存时间，单位为毫秒，默认为 60,000 毫秒（1分钟）
   * @returns {Promise<void>}
   */
  public static setItem(key: string, value: string, ttl: number = 60_000) {
    const storage = useStorage()
    return storage.setItem(this.getKey(key), value, { ttl })
  }

  /**
   * 从 Redis 中删除指定的键值对
   * @param {string} key 缓存键名
   * @returns {Promise<void>}
   */
  public static removeItem(key: string) {
    const storage = useStorage()
    return storage.removeItem(this.getKey(key))
  }
}
