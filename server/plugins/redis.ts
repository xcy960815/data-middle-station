import RedisDriver from 'unstorage/drivers/redis'

const logger = new Logger({
  fileName: 'redis',
  folderName: 'plugins'
})

/**
 * Redis服务配置
 */
const serviceRedisBase = useRuntimeConfig().serviceRedisBase // Redis数据库索引
/**
 * Redis服务器主机地址
 */
const serviceRedisHost = useRuntimeConfig().serviceRedisHost // Redis服务器主机地址
/**
 * Redis服务器端口
 */
const serviceRedisPort = useRuntimeConfig().serviceRedisPort // Redis服务器端口
/**
 * Redis用户名
 */
const serviceRedisUsername = useRuntimeConfig().serviceRedisUsername // Redis用户名
/**
 * Redis密码
 */
const serviceRedisPassword = useRuntimeConfig().serviceRedisPassword // Redis密码

/**
 * 测试redis是否连接成功
 */
export const isConnectedRedis = async () => {
  const storage = useStorage()
  try {
    await storage.setItem(`${RedisStorage.REDIS_DRIVER}:test`, 'test1234', {})
    const testValue = await storage.getItem(`${RedisStorage.REDIS_DRIVER}:test`)
    if (testValue) {
      logger.info(`redis 测试通过`)
      await storage.removeItem(`${RedisStorage.REDIS_DRIVER}:test`)
      return true
    } else {
      logger.error(`redis 测试失败: 无法读取写入的测试值`)
      return false
    }
  } catch (error: any) {
    logger.error(`redis 测试失败: ${error.message || error}`)
    return false
  }
}

/**
 * @desc 初始化Redis 驱动
 * @returns {Promise<void>}
 */
export default defineNitroPlugin(async () => {
  const storage = useStorage()
  // 判断是否已经挂载
  if (!storage.getMount(RedisStorage.REDIS_DRIVER)) {
    logger.info(`redis 未挂载，开始挂载`)
    try {
      logger.info(`redis 配置信息: host=${serviceRedisHost}, port=${serviceRedisPort}, base=${serviceRedisBase}`)
      const redisDriver = RedisDriver({
        base: serviceRedisBase,
        host: serviceRedisHost,
        port: Number(serviceRedisPort),
        username: serviceRedisUsername,
        password: serviceRedisPassword
      })
      storage.mount(RedisStorage.REDIS_DRIVER, redisDriver)

      // 等待一段时间确保Redis连接已建立
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const isConnected = await isConnectedRedis()
      if (isConnected) {
        logger.info(`redis 连接成功并测试通过`)
      } else {
        logger.error(`redis 连接测试失败，请检查Redis服务是否正常运行`)
      }
    } catch (error: any) {
      logger.error(`redis 挂载失败: ${error.message || error}`)
    }
  } else {
    logger.info(`redis 已挂载，跳过挂载步骤`)
    await isConnectedRedis()
  }
})
