import chalk from 'chalk'

const logger = new Logger({
  fileName: 'database',
  folderName: 'database'
})

/**
 * @desc 获取数据库配置
 * @returns {Promise<Array<NodeJS.DataSourceItem>>}
 */
export function getDatasourceConfig() {
  logger.info(chalk.green('开始加载数据库配置'))

  const serviceDbName = useRuntimeConfig().serviceDbName
  const serviceDbHost = useRuntimeConfig().serviceDbHost
  const serviceDbPort = useRuntimeConfig().serviceDbPort
  const serviceDbUser = useRuntimeConfig().serviceDbUser
  const serviceDbPwd = useRuntimeConfig().serviceDbPwd
  const serviceDbTimezone =
    useRuntimeConfig().serviceDbTimezone
  const serviceDbStrings =
    useRuntimeConfig().serviceDbStrings

  const serviceDataDbName =
    useRuntimeConfig().serviceDataDbName
  const serviceDataDbHost =
    useRuntimeConfig().serviceDataDbHost
  const serviceDataDbPort =
    useRuntimeConfig().serviceDataDbPort
  const serviceDataDbUser =
    useRuntimeConfig().serviceDataDbUser
  const serviceDataDbPwd =
    useRuntimeConfig().serviceDataDbPwd
  const serviceDataDbTimezone =
    useRuntimeConfig().serviceDataDbTimezone
  const serviceDataDbStrings =
    useRuntimeConfig().serviceDataDbStrings

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
  logger.info(
    chalk.bgBlackBright(
      JSON.stringify(dataSourceConfig, null, 2)
    )
  )
  logger.info(chalk.green('数据库配置加载完成-------'))
  return dataSourceConfig
}
