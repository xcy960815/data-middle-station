import cron from 'node-cron'
import { AdvancedScheduler } from '../service/advancedScheduler'
import { ScheduledEmailService } from '../service/scheduledEmailService'

const scheduledEmailService = new ScheduledEmailService()
const advancedScheduler = new AdvancedScheduler()
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

  // 启动高级调度器（毫秒级精度）
  await advancedScheduler.start()

  // ┌────────────── second (可选)
  // │ ┌──────────── 分钟 (minute，0 - 59)
  // │ │ ┌────────── 小时 (hour，0 - 23)
  // │ │ │ ┌──────── 一个月中的第几天 (day of month，1 - 31)
  // │ │ │ │ ┌────── 月份 (month，1 - 12)
  // │ │ │ │ │ ┌──── 一个星期中星期几 (day of week，0 - 6) 注意：星期天为 0
  // │ │ │ │ │ │
  // │ │ │ │ │ │
  // * * * * * *

  // 每10秒检查一次是否有需要执行的定时邮件任务（提高精度）
  cron.schedule('*/10 * * * * *', async () => {
    try {
      logger.debug('检查定时邮件任务')
      await scheduledEmailService.processPendingTasks()
    } catch (error) {
      logger.error(`执行定时邮件任务时发生错误: ${error}`)
    }
  })

  // 每分钟执行一次精确时间检查（处理秒级精度）
  cron.schedule('* * * * *', async () => {
    try {
      logger.debug('执行精确时间检查')
      await scheduledEmailService.processExactTimeTasks()
    } catch (error) {
      logger.error(`执行精确时间检查时发生错误: ${error}`)
    }
  })

  // 每5分钟检查一次失败任务的重试
  cron.schedule('*/5 * * * *', async () => {
    try {
      logger.debug('检查失败任务重试')
      await scheduledEmailService.retryFailedTasks()
    } catch (error) {
      logger.error(`重试失败任务时发生错误: ${error}`)
    }
  })

  // 每30秒检查一次调度器状态
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const status = advancedScheduler.getStatus()
      logger.debug(`高级调度器状态: 运行中=${status.isRunning}, 待执行任务=${status.scheduledTasks}`)
    } catch (error) {
      logger.error(`检查调度器状态失败: ${error}`)
    }
  })

  logger.info('定时邮件任务调度器已启动，支持毫秒级精度调度')
})
