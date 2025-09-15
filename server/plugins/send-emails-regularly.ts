// import { AdvancedScheduler } from '../service/advancedScheduler'
import { ScheduledEmailService } from '../service/scheduledEmailService'

const scheduledEmailService = new ScheduledEmailService()
// const advancedScheduler = new AdvancedScheduler()
const logger = new Logger({
  fileName: 'send-emails-regularly',
  folderName: 'plugins'
})

/**
 * @desc 定时邮件发送调度插件
 * @link https://juejin.cn/post/6998158614963683358
 */
export default defineNitroPlugin(async () => {
  logger.info('邮件发送调度任务开启')

  // ┌────────────── second (可选)
  // │ ┌──────────── 分钟 (minute，0 - 59)
  // │ │ ┌────────── 小时 (hour，0 - 23)
  // │ │ │ ┌──────── 一个月中的第几天 (day of month，1 - 31)
  // │ │ │ │ ┌────── 月份 (month，1 - 12)
  // │ │ │ │ │ ┌──── 一个星期中星期几 (day of week，0 - 6) 注意：星期天为 0
  // │ │ │ │ │ │
  // │ │ │ │ │ │
  // * * * * * *

  // // 每10秒检查一次是否有需要执行的定时邮件任务（提高精度）
  // cron.schedule('*/10 * * * * *', async () => {
  //   try {
  //     logger.debug('检查定时邮件任务')
  //     await scheduledEmailService.processPendingTasks()
  //   } catch (error) {
  //     logger.error(`执行定时邮件任务时发生错误: ${error}`)
  //   }
  // })
})
