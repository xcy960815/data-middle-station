import RedisDriver from 'unstorage/drivers/redis'

/**
 * Redis 插件专用日志实例
 * @type {Logger}
 */
const logger = new Logger({
  fileName: 'redis',
  folderName: 'plugins'
})

/**
 * Redis数据库索引/前缀基础名
 * @type {string}
 */
const serviceRedisBase = useRuntimeConfig().serviceRedisBase // Redis数据库索引
/**
 * Redis服务器主机地址
 * @type {string}
 */
const serviceRedisHost = useRuntimeConfig().serviceRedisHost // Redis服务器主机地址
/**
 * Redis服务器端口
 * @type {string}
 */
const serviceRedisPort = useRuntimeConfig().serviceRedisPort // Redis服务器端口
/**
 * Redis用户名
 * @type {string}
 */
const serviceRedisUsername = useRuntimeConfig().serviceRedisUsername // Redis用户名
/**
 * Redis密码
 * @type {string}
 */
const serviceRedisPassword = useRuntimeConfig().serviceRedisPassword // Redis密码

/**
 * 测试 Redis 是否连接成功并能够读写临时数据
 * @returns {Promise<void>}
 */
export const isConnectedRedis = async () => {
  const storage = useStorage()
  await storage.setItem(`${RedisStorage.REDIS_DRIVER}:test`, 'test1234', {})
  const testValue = await storage.getItem(`${RedisStorage.REDIS_DRIVER}:test`)
  if (testValue) {
    logger.info(`redis 测试通过`)
    await storage.removeItem(`${RedisStorage.REDIS_DRIVER}:test`)
  } else {
    logger.error(`redis 测试失败: 无法读取写入的测试值`)
  }
}

/**
 * 注册 Redis 插件并将其挂载到 nitroApp 上
 * @param {NitroApp} nitroApp Nitro 应用对象
 * @returns {Promise<void>}
 */
export default defineNitroPlugin(async (nitroApp) => {
  // 挂载redis驱动
  logger.info(`开始初始化redis 插件`)
  const storage = useStorage()
  const redisDriver = RedisDriver({
    name: RedisStorage.REDIS_DRIVER,
    base: serviceRedisBase,
    host: serviceRedisHost,
    port: Number(serviceRedisPort),
    username: serviceRedisUsername,
    password: serviceRedisPassword
  })
  storage.mount(RedisStorage.REDIS_DRIVER, redisDriver)
  logger.info(`redis 插件初始化成功`)

  // 测试redis是否连接成功
  await isConnectedRedis()

  // 关闭时卸载redis驱动
  nitroApp.hooks.hook('close', () => {
    logger.info('项目关闭或者重启，卸载redis插件')
    storage.unmount(RedisStorage.REDIS_DRIVER)
  })
})
