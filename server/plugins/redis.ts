import redisDriver from 'unstorage/drivers/redis'
import { Logger } from '../utils/logger'

const logger = new Logger({
  fileName: 'redis',
  folderName: 'plugins'
})

/**
 * @desc 初始化Redis 驱动
 * @returns {void}
 */
export default defineNitroPlugin(() => {
  const storage = useStorage()
  // 判断是否已经挂载
  if (storage.getMount('redis')) {
    logger.info('redis 已经挂载')
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
          serviceRedisPassword
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
  logger.info('redis 挂载成功')
})
