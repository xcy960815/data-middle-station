/**
 * @desc 为 process.env 添加自定义属性
 * @example process.env.NODE_ENV
 * @example process.env.VUE_APP_BASE_API
 * @example process.env.VUE_APP_BASE_URL
 */
declare namespace NodeJS {
  type PoolOptions = import('mysql2/promise').PoolOptions

  type RedisOptions =
    import('unstorage/drivers/redis').RedisOptions

  type DB_HOST = PoolOptions['host']
  type DB_PORT = PoolOptions['port']
  type DB_USER = PoolOptions['user']
  type DB_PASSWORD = PoolOptions['password']
  type DB_DATABASE = PoolOptions['database']
  type DB_TIMEZONE = PoolOptions['timezone']
  type DB_DATE_STRINGS = PoolOptions['dateStrings']

  type REDIS_HOST = RedisOptions['host']
  type REDIS_PORT = RedisOptions['port']
  type REDIS_PASSWORD = RedisOptions['password']
  type REDIS_DB = RedisOptions['db']

  type REDIS_USERNAME = RedisOptions['username']

  interface ProcessEnv {
    // 给 ProcessEnv 添加自定义属性
    // 日志存放路径
    LOG_PATH: string
    // 日志时间格式
    LOG_TIME_FORMAT: string
    // 项目标题
    APP_NAME: string
    // 数据库主机
    DB_HOST: DB_HOST
    // 数据库端口
    DB_PORT: DB_PORT
    // 数据库用户
    DB_USER: DB_USER
    // 数据库密码
    DB_PASSWORD: DB_PASSWORD
    // 配置数据库名称
    CONFIG_DB_NAME: DB_DATABASE
    // 图表数据数据库名称
    CHART_DATA_DB_NAME: DB_DATABASE
    // Redis主机
    REDIS_HOST: REDIS_HOST
    // Redis端口
    REDIS_PORT: REDIS_PORT
    // Redis密码
    REDIS_PASSWORD: REDIS_PASSWORD
    // Redis数据库
    REDIS_DB: REDIS_DB
    // Redis用户名
    REDIS_USERNAME: REDIS_USERNAME
  }

  /**
   * @desc 数据库配置
   */
  type DataSourceConfig = {
    [key: string]: {
      [key: keyof PoolOptions]: PoolOptions[key]
    }
  }
}
