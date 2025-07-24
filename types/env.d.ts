/**
 * @desc 为 process.env 添加自定义属性
 */
declare namespace NodeJS {
  /**
   * @desc 数据库配置
   */
  type PoolOptions = import('mysql2/promise').PoolOptions

  /**
   * @desc redis配置
   */
  type RedisOptions = import('unstorage/drivers/redis').RedisOptions

  /**
   * @desc 数据库配置
   */
  type DB_HOST = PoolOptions['host']
  type DB_PORT = PoolOptions['port']
  type DB_USER = PoolOptions['user']
  type DB_PASSWORD = PoolOptions['password']
  type DB_DATABASE = PoolOptions['database']
  type DB_TIMEZONE = PoolOptions['timezone']
  type DB_DATE_STRINGS = PoolOptions['dateStrings']

  /**
   * @desc redis配置
   */
  type REDIS_HOST = RedisOptions['host']
  type REDIS_PORT = RedisOptions['port']
  type REDIS_PASSWORD = RedisOptions['password']
  type REDIS_DB = RedisOptions['db']
  type REDIS_USERNAME = RedisOptions['username']
  type REDIS_BASE = RedisOptions['base']

  interface ProcessEnv {
    // 给 ProcessEnv 添加自定义属性
    /**
     * 日志存放路径
     */
    LOG_PATH: string
    /**
     * 日志时间格式
     */
    LOG_TIME_FORMAT: string
    /**
     * 项目标题
     */
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
    SERVICE_DATA_DB_NAME: DB_DATABASE
    /**
     * 所需数据分析数据库主机
     */
    SERVICE_DATA_DB_HOST: DB_HOST
    /**
     * 所需数据分析数据库端口
     */
    SERVICE_DATA_DB_PORT: DB_PORT
    /**
     * 所需数据分析数据库用户
     */
    SERVICE_DATA_DB_USER: DB_USER
    /**
     * 所需数据分析数据库密码
     */
    SERVICE_DATA_DB_PASSWORD: DB_PASSWORD
    /**
     * 所需数据分析数据库时区
     */
    SERVICE_DATA_DB_TIMEZONE: DB_TIMEZONE
    /**
     * 所需数据分析数据库日期字符串
     */
    SERVICE_DATA_DB_DATE_STRINGS: DB_DATE_STRINGS

    // 服务redis配置
    /**
     * 服务redis主机
     */
    SERVICE_REDIS_HOST: REDIS_HOST
    /**
     * 服务redis端口
     */
    SERVICE_REDIS_PORT: REDIS_PORT
    /**
     * 服务redis密码
     */
    SERVICE_REDIS_PASSWORD: REDIS_PASSWORD
    /**
     * 服务redis数据库
     */
    SERVICE_REDIS_DB: REDIS_DB
    /**
     * 服务redis用户名
     */
    SERVICE_REDIS_USERNAME: REDIS_USERNAME
    /**
     * 服务redis基础
     */
    SERVICE_REDIS_BASE: REDIS_BASE

    /**
     * 接口基础路径
     */
    API_BASE: string
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
