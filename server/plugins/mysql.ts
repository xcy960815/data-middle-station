import boxen from 'boxen'
import chalk from 'chalk'
import figlet from 'figlet'
import gradient from 'gradient-string'
import mysql from 'mysql2/promise'

/**
 * 数据库模块专用日志实例
 * @type {Logger}
 */
const logger = new Logger({
  fileName: 'database',
  folderName: 'database'
})

/**
 * 获取数据库配置，并在控制台格式化输出酷炫的启动字样与连接信息
 * @returns {NodeJS.DataSourceConfig} 数据库配置对象
 */
const getDatasourceConfig = (): NodeJS.DataSourceConfig => {
  const serviceDbName = useRuntimeConfig().serviceDbName
  const serviceDbHost = useRuntimeConfig().serviceDbHost
  const serviceDbPort = useRuntimeConfig().serviceDbPort
  const serviceDbUser = useRuntimeConfig().serviceDbUser
  const serviceDbPwd = useRuntimeConfig().serviceDbPwd
  const serviceDbTimezone = useRuntimeConfig().serviceDbTimezone
  const serviceDbStrings = useRuntimeConfig().serviceDbStrings

  const serviceDbDecimalNumbers = useRuntimeConfig().serviceDbDecimalNumbers

  const serviceDataDbName = useRuntimeConfig().serviceDataDbName
  const serviceDataDbHost = useRuntimeConfig().serviceDataDbHost
  const serviceDataDbPort = useRuntimeConfig().serviceDataDbPort
  const serviceDataDbUser = useRuntimeConfig().serviceDataDbUser
  const serviceDataDbPwd = useRuntimeConfig().serviceDataDbPwd
  const serviceDataDbTimezone = useRuntimeConfig().serviceDataDbTimezone
  const serviceDataDbStrings = useRuntimeConfig().serviceDataDbStrings

  const serviceDataDbDecimalNumbers = useRuntimeConfig().serviceDataDbDecimalNumbers

  const dataSourceConfig: NodeJS.DataSourceConfig = {
    [serviceDbName]: {
      password: serviceDbPwd,
      host: serviceDbHost,
      port: serviceDbPort,
      user: serviceDbUser,
      database: serviceDbName,
      timezone: serviceDbTimezone,
      dateStrings: serviceDbStrings,
      decimalNumbers: serviceDbDecimalNumbers
    },
    [serviceDataDbName]: {
      password: serviceDataDbPwd,
      host: serviceDataDbHost,
      port: serviceDataDbPort,
      user: serviceDataDbUser,
      database: serviceDataDbName,
      timezone: serviceDataDbTimezone,
      dateStrings: serviceDataDbStrings,
      decimalNumbers: serviceDataDbDecimalNumbers
    }
  }

  // 使用超级炫酷的彩色输出替代console.table
  console.log('\n')

  // 使用figlet生成大字体标题
  const title = figlet.textSync('DataMiddleStation', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 100,
    whitespaceBreak: true
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
      title: '💾 数据库配置',
      titleAlignment: 'center'
    })

    console.log(boxContent)
  })
  return dataSourceConfig
}

/**
 * 检查所有 MySQL 连接池是否可用
 * @param {Map<string, mysql.Pool>} pools 连接池 Map
 * @returns {Promise<void>}
 */
export async function checkMysqlConnection(pools: Map<string, mysql.Pool>) {
  for (const [name, pool] of pools.entries()) {
    let conn: mysql.PoolConnection | null = null
    try {
      conn = await pool.getConnection()
      await conn.ping()
      logger.info(chalk.green(`MySQL 数据源 [${name}] 连接成功`))
    } catch (error) {
      logger.error(chalk.red(`MySQL 数据源 [${name}] 连接失败: ${error}`))
    } finally {
      conn?.release()
    }
  }
}

/**
 * 注册 mysql 插件并将其挂载到 nitroApp 上
 * @param {NitroApp} nitroApp Nitro 应用对象
 * @returns {void}
 */
export default defineNitroPlugin((nitroApp) => {
  // 获取数据库配置
  const dataSourceConfig = getDatasourceConfig()

  logger.info(`开始初始化mysql 插件`)

  const pools = new Map<string, mysql.Pool>()
  for (const [name, config] of Object.entries(dataSourceConfig)) {
    pools.set(name, mysql.createPool({ ...config, connectionLimit: 20 }))
  }
  nitroApp.mysqlPools = pools
  logger.info(`mysql 插件初始化成功`)

  /**
   * 检查所有 MySQL 连接池是否可用
   */
  checkMysqlConnection(pools)

  nitroApp.hooks.hook('close', () => {
    logger.info('项目关闭或者重启，卸载mysql插件')
    for (const pool of pools.values()) {
      pool.end()
    }
  })
})
