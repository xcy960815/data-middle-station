import cron from 'node-cron'

const logger = new Logger({
  fileName: 'send-emails-regularly',
  folderName: 'plugins'
})

/**
 * @desc 发送邮件任务类型
 * @link https://juejin.cn/post/6998158614963683358
 */
export default defineNitroPlugin(() => {
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
  cron.schedule('0 * * * *', () => {
    logger.info('每分钟执行一次发送邮件任务')
  })
})
