import chalk from 'chalk'
const logger = new Logger({
  fileName: 'log',
  folderName: 'middleware'
})
/**
 * @desc 打印日志中间件
 */
export default defineEventHandler(async (event) => {
  const requestUrl = getRequestURL(event).toString()
  if (requestUrl.includes('api')) {
    logger.info(
      chalk.greenBright('访问的接口' + requestUrl)
    )
  }
})
