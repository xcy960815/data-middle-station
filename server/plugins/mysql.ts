import mysql from 'mysql2/promise'
import chalk from 'chalk'
import gradient from 'gradient-string'
import boxen from 'boxen'
import figlet from 'figlet'

const logger = new Logger({
  fileName: 'database',
  folderName: 'database'
})

/**
 * @desc 获取数据库配置
 * @returns {Promise<Array<NodeJS.DataSourceItem>>}
 */
const getDatasourceConfig = () => {
  const serviceDbName = useRuntimeConfig().serviceDbName
  const serviceDbHost = useRuntimeConfig().serviceDbHost
  const serviceDbPort = useRuntimeConfig().serviceDbPort
  const serviceDbUser = useRuntimeConfig().serviceDbUser
  const serviceDbPwd = useRuntimeConfig().serviceDbPwd
  const serviceDbTimezone = useRuntimeConfig().serviceDbTimezone
  const serviceDbStrings = useRuntimeConfig().serviceDbStrings

  const serviceDataDbName = useRuntimeConfig().serviceDataDbName
  const serviceDataDbHost = useRuntimeConfig().serviceDataDbHost
  const serviceDataDbPort = useRuntimeConfig().serviceDataDbPort
  const serviceDataDbUser = useRuntimeConfig().serviceDataDbUser
  const serviceDataDbPwd = useRuntimeConfig().serviceDataDbPwd
  const serviceDataDbTimezone = useRuntimeConfig().serviceDataDbTimezone
  const serviceDataDbStrings = useRuntimeConfig().serviceDataDbStrings

  const dataSourceConfig: NodeJS.DataSourceConfig = {
    [serviceDbName]: {
      password: serviceDbPwd,
      host: serviceDbHost,
      port: serviceDbPort,
      user: serviceDbUser,
      database: serviceDbName,
      timezone: serviceDbTimezone,
      dateStrings: serviceDbStrings
    },
    [serviceDataDbName]: {
      password: serviceDataDbPwd,
      host: serviceDataDbHost,
      port: serviceDataDbPort,
      user: serviceDataDbUser,
      database: serviceDataDbName,
      timezone: serviceDataDbTimezone,
      dateStrings: serviceDataDbStrings
    }
  }

  // 使用超级炫酷的彩色输出替代console.table
  console.log('\n')

  // 使用figlet生成大字体标题
  const title = figlet.textSync('Database', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  })

  // 使用自定义渐变色输出标题，替代已弃用的pastel
  const customGradient = gradient(['#12c2e9', '#c471ed', '#f64f59'])
  console.log(customGradient.multiline(title))
  console.log('\n')

  Object.entries(dataSourceConfig).forEach(([dbName, config]) => {
    // 添加类型断言解决类型错误
    const typedConfig = config as {
      host: string
      port: string
      user: string
      password: string
      timezone: string
      dateStrings: string
    }

    const items = [
      {
        key: '🌐 地址',
        value: `${typedConfig.host}:${typedConfig.port}`
      },
      { key: '👤 用户', value: typedConfig.user },
      { key: '🔑 密码', value: '******' },
      { key: '🕒 时区', value: typedConfig.timezone },
      {
        key: '📅 日期格式化',
        value: typedConfig.dateStrings
      }
    ]

    // 构建内容字符串，使用自定义渐变色
    const dbGradient = gradient(['#00F260', '#0575E6'])
    let content = dbGradient(`✨ 数据库: ${dbName} ✨\n\n`)

    items.forEach((item) => {
      content += chalk.cyan(`${item.key}: `) + chalk.bold.white(item.value) + '\n'
    })

    // 使用boxen创建一个漂亮的框
    const boxContent = boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#000',
      title: '💾 数据库配置',
      titleAlignment: 'center'
    })

    console.log(boxContent)
  })
  return dataSourceConfig
}

/**
 * 检查所有 MySQL 连接池是否可用
 */
export async function checkMysqlConnection(pools: Map<string, mysql.Pool>) {
  for (const [name, pool] of pools.entries()) {
    try {
      const conn = await pool.getConnection()
      await conn.ping()
      conn.release()
      logger.info(chalk.green(`MySQL 数据源 [${name}] 连接成功`))
    } catch (error) {
      logger.error(chalk.red(`MySQL 数据源 [${name}] 连接失败: ${error}`))
    }
  }
}

/**
 * 注册mysql插件
 */
export default defineNitroPlugin((nitroApp) => {
  const dataSourceConfig = getDatasourceConfig()

  logger.info(`开始初始化mysql 插件`)

  const pools = new Map<string, mysql.Pool>()
  for (const [name, config] of Object.entries(dataSourceConfig)) {
    pools.set(name, mysql.createPool(config))
  }
  nitroApp.mysqlPools = pools
  logger.info(`mysql 插件初始化成功`)

  /**
   * 检查所有 MySQL 连接池是否可用
   */
  checkMysqlConnection(pools)

  nitroApp.hooks.hook('close', () => {
    logger.info('mysql 插件卸载')
    for (const pool of pools.values()) {
      pool.end()
    }
  })
})
