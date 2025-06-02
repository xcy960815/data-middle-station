import redisDriver from 'unstorage/drivers/redis'

/**
 * @desc 初始化Redis 驱动
 * @returns {void}
 */
export default defineNitroPlugin(() => {
  const storage = useStorage()
  // // 判断是否已经挂载
  if (storage.getMount('redis')) {
    return
  }
  const REDIS_HOST = getProcessEnvProperties('REDIS_HOST')
  const REDIS_PORT = getProcessEnvProperties('REDIS_PORT')
  const REDIS_USERNAME = getProcessEnvProperties(
    'REDIS_USERNAME'
  )
  const REDIS_PASSWORD = getProcessEnvProperties(
    'REDIS_PASSWORD'
  )
  const driver = redisDriver({
    base: 'redis',
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD
  })
  storage.mount('redis', driver)
})
