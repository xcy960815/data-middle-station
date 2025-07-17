import mysql from 'mysql2/promise'
import chalk from 'chalk'

const logger = new Logger({
  fileName: 'database',
  folderName: 'database'
})

/**
 * 检查所有 MySQL 连接池是否可用
 */
export async function checkMysqlConnection(
  pools: Map<string, mysql.Pool>
) {
  for (const [name, pool] of pools.entries()) {
    try {
      const conn = await pool.getConnection()
      await conn.ping()
      conn.release()
      logger.info(
        chalk.green(`MySQL 数据源 [${name}] 连接成功`)
      )
    } catch (error) {
      logger.error(
        chalk.red(
          `MySQL 数据源 [${name}] 连接失败: ${error}`
        )
      )
    }
  }
}

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
  logger.info('mysql插件注册成功')

  /**
   * 检查所有 MySQL 连接池是否可用
   */
  checkMysqlConnection(pools)

  nitroApp.hooks.hook('close', () => {
    console.log('close')
    for (const pool of pools.values()) {
      pool.end()
    }
  })
})
