import chalk from 'chalk'
const logger = new Logger({
  fileName: 'log',
  folderName: 'middleware'
})
/**
 * @desc 打印日志中间件
 */
export default defineEventHandler(async (event) => {
  logger.info(
    chalk.greenBright(getRequestURL(event).toString())
  )
})
