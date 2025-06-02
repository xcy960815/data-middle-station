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
  const configDbHost = getProcessEnvProperties(
    'CONFIG_DB_HOST'
  )
  const configDbPort = getProcessEnvProperties(
    'CONFIG_DB_PORT'
  )
  const configDbUser = getProcessEnvProperties(
    'CONFIG_DB_USER'
  )
  const configDbPassword =
    getProcessEnvProperties('CONFIG_DB_PASSWORD') || ''
  const configDbName = getProcessEnvProperties(
    'CONFIG_DB_NAME'
  ) as string
  const configDbTimezone = getProcessEnvProperties(
    'CONFIG_DB_TIMEZONE'
  )
  const configDbDateStrings = getProcessEnvProperties(
    'CONFIG_DB_DATE_STRINGS'
  )
  const kanbanDbName = getProcessEnvProperties(
    'KANBAN_DB_NAME'
  ) as string
  const kanbanDbHost = getProcessEnvProperties(
    'KANBAN_DB_HOST'
  )
  const kanbanDbPort = getProcessEnvProperties(
    'KANBAN_DB_PORT'
  )
  const kanbanDbUser = getProcessEnvProperties(
    'KANBAN_DB_USER'
  )
  const kanbanDbPassword = getProcessEnvProperties(
    'KANBAN_DB_PASSWORD'
  )
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
      database: kanbanDbName
    }
  }
  return dataSourceConfig
}
