import mysql from 'mysql2/promise'
import chalk from 'chalk'

// 扩展NitroApp类型，使用any绕过类型检查
declare module 'nitropack' {
  export interface NitroApp {
    mysqlPools: Map<string, mysql.Pool>
  }
}

const logger = new Logger({
  fileName: 'database',
  folderName: 'database'
})

/**
 * 注册mysql插件
 */
export default defineNitroPlugin((nitroApp) => {
  const dataSourceConfig = getDatasourceConfig()
  const pools = new Map<string, mysql.Pool>()
  for (const [name, config] of Object.entries(
    dataSourceConfig
  )) {
    pools.set(name, mysql.createPool(config))
  }
  nitroApp.mysqlPools = pools
  logger.info(chalk.green('mysql插件注册成功'))
  nitroApp.hooks.hook('close', () => {
    console.log('close')
    for (const pool of pools.values()) {
      pool.end()
    }
  })
})
