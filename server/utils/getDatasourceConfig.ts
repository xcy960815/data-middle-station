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
  const configDbHost = useRuntimeConfig().configDbHost
  const configDbPort = useRuntimeConfig().configDbPort
  const configDbUser = useRuntimeConfig().configDbUser
  const configDbPassword =
    useRuntimeConfig().configDbPassword
  const configDbName = useRuntimeConfig().configDbName
  const configDbTimezone =
    useRuntimeConfig().configDbTimezone
  const configDbDateStrings =
    useRuntimeConfig().configDbDateStrings
  const kanbanDbName = useRuntimeConfig().kanbanDbName
  const kanbanDbHost = useRuntimeConfig().kanbanDbHost
  const kanbanDbPort = useRuntimeConfig().kanbanDbPort
  const kanbanDbUser = useRuntimeConfig().kanbanDbUser
  const kanbanDbPassword =
    useRuntimeConfig().kanbanDbPassword
  const kanbanDbTimezone =
    useRuntimeConfig().kanbanDbTimezone
  const kanbanDbDateStrings =
    useRuntimeConfig().kanbanDbDateStrings
  const dataSourceConfig: NodeJS.DataSourceConfig = {
    [configDbName]: {
      password: configDbPassword,
      host: configDbHost,
      port: configDbPort,
      user: configDbUser,
      database: configDbName,
      timezone: configDbTimezone,
      dateStrings: configDbDateStrings
    },
    [kanbanDbName]: {
      password: kanbanDbPassword,
      host: kanbanDbHost,
      port: kanbanDbPort,
      user: kanbanDbUser,
      database: kanbanDbName,
      timezone: kanbanDbTimezone,
      dateStrings: kanbanDbDateStrings
    }
  }
  logger.info(
    chalk.bgBlackBright(
      JSON.stringify(dataSourceConfig, null, 2)
    )
  )
  logger.info(chalk.green('数据库配置加载完成'))
  return dataSourceConfig
}
