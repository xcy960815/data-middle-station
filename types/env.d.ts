/**
 * @desc 为 process.env 添加自定义属性
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
    // 服务数据库配置
    /**
     * 服务数据库主机
     */
    SERVICE_DB_HOST: DB_HOST
    /**
     * 服务数据库端口
     */
    SERVICE_DB_PORT: DB_PORT
    /**
     * 服务数据库用户
     */
    SERVICE_DB_USER: DB_USER
    /**
     * 服务数据库密码
     */
    SERVICE_DB_PASSWORD: DB_PASSWORD
    /**
     * 服务数据库名称
     */
    SERVICE_DB_NAME: DB_DATABASE
    /**
     * 服务数据库时区
     */
    SERVICE_DB_TIMEZONE: DB_TIMEZONE
    /**
     * 服务数据库日期字符串
     */
    SERVICE_DB_DATE_STRINGS: DB_DATE_STRINGS

    // 所需数据分析数据库配置
    /**
     * 所需数据分析数据库名称
     */
    SERVICE_DATA_MYSQL_DATABASE: DB_DATABASE
    /**
     * 所需数据分析数据库主机
     */
    SERVICE_DATA_MYSQL_HOST: DB_HOST
    /**
     * 所需数据分析数据库端口
     */
    SERVICE_DATA_MYSQL_PORT: DB_PORT
    /**
     * 所需数据分析数据库用户
     */
    SERVICE_DATA_MYSQL_ROOT_USER: DB_USER
    /**
     * 所需数据分析数据库密码
     */
    SERVICE_DATA_MYSQL_ROOT_PASSWORD: DB_PASSWORD
    /**
     * 所需数据分析数据库时区
     */
    SERVICE_DATA_MYSQL_TIMEZONE: DB_TIMEZONE
    /**
     * 所需数据分析数据库日期字符串
     */
    SERVICE_DATA_MYSQL_DATE_STRINGS: DB_DATE_STRINGS

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
