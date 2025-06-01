/**
 * @desc 为 process.env 添加自定义属性
 * @example process.env.NODE_ENV
 * @example process.env.VUE_APP_BASE_API
 * @example process.env.VUE_APP_BASE_URL
 */
declare global {
  namespace NodeJS {
    // interface DataSourceConfig {
    //   [dataSourceKey: string]: import('mysql2/promise').PoolOptions;
    // }
    interface ProcessEnv {
      // 给 ProcessEnv 添加自定义属性
      dataSourceConfig: string
      LOG_PATH: string
      LOG_TIME_FORMAT: string
      PROJECT_TITLE: string
      DB_HOST: string
      DB_PORT: number
      DB_USER: string
      DB_PASSWORD: string
      CONFIG_DB_NAME: string
      CHART_DATA_DB_NAME: string
      REDIS_HOST: string
      REDIS_PORT: number
      REDIS_PASSWORD: string
      REDIS_DB: number
    }
  }
}
export {}
