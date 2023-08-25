/**
 * @desc 为 process.env 添加自定义属性
 * @example process.env.NODE_ENV
 * @example process.env.VUE_APP_BASE_API
 * @example process.env.VUE_APP_BASE_URL
 */
declare global {
  namespace NodeJS {
    import mysql from 'mysql2/promise';
    interface DataSourceConfig {
      [dataSourceKey: string]: mysql.PoolOptions;
    }
    interface ProcessEnv {
      // 给 ProcessEnv 添加自定义属性
      dataSourceConfig: string;
    }
  }
}
export {};
