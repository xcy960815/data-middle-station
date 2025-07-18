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
  await storage.setItem(`${RedisStorage.REDIS_DRIVER}:test`, 'test1234', { ttl: 60_000 })
  const testValue = await storage.getItem(`${RedisStorage.REDIS_DRIVER}:test`)
  if (testValue) {
    logger.info(`redis 测试通过`)
    // await storage.removeItem(`${RedisStorage.REDIS_DRIVER}:test`)
    return true
  } else {
    logger.error(`redis 测试失败`)
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
  // if (!storage.getMount(RedisStorage.REDIS_DRIVER)) {
  //   logger.info(`redis 未挂载，开始挂载`)
  const redisDriver = RedisDriver({
    name: serviceRedisBase,
    base: serviceRedisBase,
    host: serviceRedisHost,
    port: Number(serviceRedisPort),
    username: serviceRedisUsername,
    password: serviceRedisPassword
  })
  // redisDriver.setItem(`${RedisStorage.REDIS_DRIVER}:test`, 'test1234', { ttl: 60_000 })
  // const testValue = await redisDriver.getItem(`${RedisStorage.REDIS_DRIVER}:test`)
  // logger.info(`redis 测试通过，test 值为: ${testValue}`)
  storage.mount(RedisStorage.REDIS_DRIVER, redisDriver)
  // }
  // await isConnectedRedis()
  await storage.setItem(`${RedisStorage.REDIS_DRIVER}:xuc`, 'xuc', { ttl: 60_000 })
  const testValue = await storage.getItem(`${RedisStorage.REDIS_DRIVER}:xuc`)
  logger.info(`redis 测试通过，xuc 值为: ${testValue}`)
  await storage.removeItem(`${RedisStorage.REDIS_DRIVER}:xuc`)
})
