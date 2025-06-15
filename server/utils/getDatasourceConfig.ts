import chalk from 'chalk'

const logger = new Logger({
  fileName: 'database',
  folderName: 'database',
})

/**
 * @desc 获取数据库配置
 * @returns {Promise<Array<NodeJS.DataSourceItem>>}
 */
export function getDatasourceConfig() {
  logger.info(chalk.green('开始加载数据库配置-------'))

  const serviceDbName = useRuntimeConfig().serviceDbName
  const serviceDbHost = useRuntimeConfig().serviceDbHost
  const serviceDbPort = useRuntimeConfig().serviceDbPort
  const serviceDbUser = useRuntimeConfig().serviceDbUser
  const serviceDbPwd = useRuntimeConfig().serviceDbPwd

  const serviceDbTimezone = useRuntimeConfig().serviceDbTimezone
  const serviceDbStrings = useRuntimeConfig().serviceDbStrings
  const dataDbName = useRuntimeConfig().dataDbName
  const dataDbHost = useRuntimeConfig().dataDbHost
  const dataDbPort = useRuntimeConfig().dataDbPort
  const dataDbUser = useRuntimeConfig().dataDbUser
  const dataDbPwd = useRuntimeConfig().dataDbPwd
  const dataDbTimezone = useRuntimeConfig().dataDbTimezone
  const dataDbStrings = useRuntimeConfig().dataDbStrings

  const dataSourceConfig: NodeJS.DataSourceConfig = {
    [serviceDbName]: {
      password: serviceDbPwd,
      host: serviceDbHost,
      port: serviceDbPort,
      user: serviceDbUser,
      database: serviceDbName,
      timezone: serviceDbTimezone,
      dateStrings: serviceDbStrings,
    },
    [dataDbName]: {
      password: dataDbPwd,
      host: dataDbHost,
      port: dataDbPort,
      user: dataDbUser,
      database: dataDbName,
      timezone: dataDbTimezone,
      dateStrings: dataDbStrings,
    },
  }
  logger.info(chalk.bgBlackBright(JSON.stringify(dataSourceConfig, null, 2)))
  logger.info(chalk.green('数据库配置加载完成-------'))
  return dataSourceConfig
}
