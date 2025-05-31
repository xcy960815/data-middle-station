import chalk from 'chalk'
// import mysql from 'mysql2/promise';
import {
  setProcessEnvProperties,
  getProcessEnvProperties
} from '~/utils/utils.server'

const logger = new Logger({
  fileName: 'database',
  folderName: 'plugins'
})
/**
 * @desc 模拟动态获取数据数据
 * @returns {Promise<NodeJS.DataSourceConfig>}
 */
async function getDatasourceList() {
  return new Promise<NodeJS.DataSourceConfig>((resolve) => {
    setTimeout(() => {
      // const password = getProcessEnvProperties('DB_PASSWORD') as mysql.PoolOptions['password'];
      // const host = getProcessEnvProperties('DB_HOST') as mysql.PoolOptions['host'];
      // const port = getProcessEnvProperties('DB_PORT') as mysql.PoolOptions['port'];
      // const user = getProcessEnvProperties('DB_USER') as mysql.PoolOptions['user'];
      // const database = getProcessEnvProperties('DB_DATABASE') as mysql.PoolOptions['database'];
      const dataSourceConfig: NodeJS.DataSourceConfig = {
        kanban_data: {
          host: '192.168.100.1',
          // host: '127.0.0.1',
          port: 3308,
          user: 'root',
          password: '123456',
          database: 'kanban_data',
          timezone: '+08:00',
          dateStrings: true // 👈 加上这个
        },
        data_middle_station: {
          host: '192.168.100.1',
          // host: '127.0.0.1',
          port: 3308,
          user: 'root',
          password: '123456',
          database: 'data_middle_station',
          timezone: '+08:00',
          dateStrings: true // 👈 加上这个
        }
      }
      resolve(dataSourceConfig)
    }, 0)
  })
}

/**
 * @desc 加载数据库配置
 * @returns {Promise<void>}
 */
export default defineNitroPlugin(async (_nitro) => {
  const dataSourceConfig = await getDatasourceList()
  console.log(dataSourceConfig)
  setProcessEnvProperties(
    'dataSourceConfig',
    JSON.stringify(dataSourceConfig, null, 2)
  )
  logger.info(chalk.green('数据库配置加载成功'))
})
