import chalk from 'chalk'
import { serverSleep } from '../../utils/utils.server'
import dayjs from 'dayjs'
const logger = new Logger({
  fileName: 'rotation',
  folderName: 'plugins'
})
/**
 * @desc 轮训类型任务
 * @returns Promise<void>
 */
async function queryTasks() {
  logger.info(
    chalk.bgCyanBright(
      `queryAlarms ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
    )
  )
  await serverSleep(300000)
  queryTasks()
}
/**
 * @desc 可以在这里做一些轮询操作
 * @returns {Promise<void>}
 */
export default defineNitroPlugin(() => {
  // console.log(chalk.green('开启轮询任务'));
  logger.info('开启轮询任务')
  queryTasks()
})
