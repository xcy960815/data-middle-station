import chalk from 'chalk';
const logger = new Logger({ fileName: 'log', folderName: 'middleware' });
/**
 * @desc 打印日志中间件
 */
export default defineEventHandler(async (event) => {
  // console.log(chalk.greenBright('中间件日志---->   ') + getRequestURL(event));
  logger.info(getRequestURL(event).toString());
});
