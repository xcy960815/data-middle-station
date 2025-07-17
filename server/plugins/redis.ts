import redisDriver from 'unstorage/drivers/redis'
import chalk from 'chalk'

const logger = new Logger({
  fileName: 'redis',
  folderName: 'plugins'
})

/**
 * 检测Redis连接状态
 * @param storage 存储实例
 * @returns {Promise<boolean>} 连接是否成功
 */
async function checkRedisConnection(
  storage: any
): Promise<boolean> {
  try {
    const testKey = 'redis:connection:test'
    const testValue = 'ping'

    // 尝试写入数据
    await storage.setItem(testKey, testValue)
    // 尝试读取数据
    const value = await storage.getItem(testKey)
    // 清理测试数据
    await storage.removeItem(testKey)

    if (value === testValue) {
      logger.info('Redis连接测试成功')
      return true
    } else {
      logger.error('Redis连接测试失败：数据验证不匹配')
      return false
    }
  } catch (error) {
    logger.error(
      chalk.red(
        'Redis连接测试失败：' + (error as Error).message
      )
    )
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
  if (storage.getMount('redis')) {
    logger.info(chalk.green('redis 已经挂载'))
    // 检测连接状态
    await checkRedisConnection(storage)
    return
  }

  const serviceRedisBase =
    useRuntimeConfig().serviceRedisBase
  const serviceRedisHost =
    useRuntimeConfig().serviceRedisHost
  const serviceRedisPort =
    useRuntimeConfig().serviceRedisPort
  const serviceRedisUsername =
    useRuntimeConfig().serviceRedisUsername
  const serviceRedisPassword =
    useRuntimeConfig().serviceRedisPassword

  logger.info(
    'redis 配置' +
      JSON.stringify(
        {
          serviceRedisHost,
          serviceRedisPort,
          serviceRedisUsername,
          serviceRedisPassword: '******' // 隐藏密码
        },
        null,
        2
      )
  )

  logger.info('redis 开始挂载')
  const driver = redisDriver({
    base: serviceRedisBase,
    host: serviceRedisHost,
    port: Number(serviceRedisPort),
    username: serviceRedisUsername,
    password: serviceRedisPassword
  })

  storage.mount('redis', driver)

  // 检测新建连接是否成功
  const isConnected = await checkRedisConnection(storage)
  if (isConnected) {
    logger.info('redis 挂载成功且连接正常')
  } else {
    logger.error('redis 挂载成功但连接异常，请检查配置')
  }
})
