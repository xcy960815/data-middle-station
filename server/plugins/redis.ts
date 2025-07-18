import redisDriver from 'unstorage/drivers/redis'

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
const serviceRedisUsername =
  useRuntimeConfig().serviceRedisUsername // Redis用户名
/**
 * Redis密码
 */
const serviceRedisPassword =
  useRuntimeConfig().serviceRedisPassword // Redis密码

/**
 * @desc 初始化Redis 驱动
 * @returns {Promise<void>}
 */
export default defineNitroPlugin(async () => {
  const storage = useStorage()
  // const redis = storage.getMount(serviceRedisBase)

  // // 判断是否已经挂载
  // if (redis) {
  //   logger.info(chalk.green('redis 已经挂载'))
  //   return
  // }

  // logger.info(
  //   'redis 配置' +
  //     JSON.stringify(
  //       {
  //         serviceRedisHost,
  //         serviceRedisPort,
  //         serviceRedisUsername,
  //         serviceRedisPassword: '******' // 隐藏密码
  //       },
  //       null,
  //       2
  //     )
  // )

  // logger.info('redis 开始挂载')

  const driver = redisDriver({
    name: serviceRedisBase,
    base: serviceRedisBase,
    host: serviceRedisHost,
    port: Number(serviceRedisPort),
    username: serviceRedisUsername,
    password: serviceRedisPassword
  })

  // 确保driver是一个对象，并且有setItem和getItem方法
  if (
    driver &&
    typeof driver.setItem === 'function' &&
    typeof driver.getItem === 'function'
  ) {
    await driver.setItem('test', 'test', {
      ttl: 1000 * 60
    })
    const value = await driver.getItem('test', {})
    console.log(value)
  } else {
    console.error(
      'Redis driver is not properly initialized'
    )
  }

  // storage.mount(serviceRedisBase, driver)

  // // 检测新建连接是否成功
  // const isConnected = await checkRedisConnection()
  // if (isConnected) {
  //   logger.info('redis 挂载成功且连接正常')
  // } else {
  //   logger.error('redis 挂载成功但连接异常，请检查配置')
  // }
})
