import chalk from 'chalk'
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
  logger.info(`queryTasks ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`)
  await serverSleep(3000000)
  queryTasks()
}
/**
 * @desc 可以在这里做一些轮询操作
 * @returns {Promise<void>}
 */
export default defineNitroPlugin(() => {
  logger.info('开启轮询任务')
  queryTasks()
})
