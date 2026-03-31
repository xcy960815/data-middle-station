import { ScheduledEmailService } from '@/server/service/scheduledEmailService'
import {
  configureScheduledEmailScheduler,
  getScheduledEmailJobCount,
  syncScheduledEmailJobs
} from '@/server/service/scheduledEmailSchedulerService'
import { Logger } from '@/server/utils/logger'
import schedule from 'node-schedule'

const scheduledEmailService = new ScheduledEmailService()

const logger = new Logger({
  fileName: 'send-emails-regularly',
  folderName: 'plugins'
})

/**
 * @desc 定时邮件发送调度插件（基于 node-schedule）
 * 优势：
 * 1. 零轮询，按需触发，资源消耗低
 * 2. 支持秒级精度
 * 3. 内存调度，无数据库压力
 * 4. 性能随任务数量线性增长
 *
 * 支持两种类型的任务：
 * 1. scheduled - 定时任务：在指定时间执行一次
 * 2. recurring - 重复任务：按照指定的周期和时间重复执行
 */
export default defineNitroPlugin(async () => {
  logger.info('📧 邮件发送调度系统初始化中...')
  logger.info('🔧 调度引擎: node-schedule')

  configureScheduledEmailScheduler(async (taskOptions) => {
    const success = await scheduledEmailService.executeTaskWithOptions({ id: taskOptions.id })
    if (success) {
      logger.info(`✅ 任务 ${taskOptions.id} 执行成功`)
    } else {
      logger.error(`❌ 任务 ${taskOptions.id} 执行失败`)
    }
  })

  // 加载所有待执行的任务并注册到调度器
  await loadAndScheduleAllTasks()

  // 每5分钟检查一次失败任务的重试
  schedule.scheduleJob('*/5 * * * *', async () => {
    try {
      logger.info('🔄 开始检查需要重试的失败任务...')
      await scheduledEmailService.retryFailedTasks()
    } catch (error) {
      logger.error(`❌ 重试失败任务失败: ${error}`)
    }
  })

  // 每小时同步一次数据库任务状态（防止任务漏执行）
  schedule.scheduleJob('0 * * * *', async () => {
    try {
      logger.info('🔄 同步数据库任务状态...')
      await loadAndScheduleAllTasks()
    } catch (error) {
      logger.error(`❌ 同步任务失败: ${error}`)
    }
  })

  logger.info('✅ 邮件发送调度系统已启动')
  logger.info('📋 调度策略：')
  logger.info(`  - 已加载 ${getScheduledEmailJobCount()} 个任务到调度器`)
  logger.info('  - 每5分钟检查失败任务重试')
  logger.info('  - 每小时同步数据库任务状态')
})

/**
 * 加载所有待执行任务并注册到 node-schedule
 */
const loadAndScheduleAllTasks = async (): Promise<void> => {
  try {
    const activeTasks = await scheduledEmailService.getScheduledEmailTaskList({
      isActive: true
    })

    logger.info(`📦 从数据库加载了 ${activeTasks.length} 个激活任务`)
    syncScheduledEmailJobs(activeTasks)
    logger.info(`✅ 成功加载 ${getScheduledEmailJobCount()} 个任务到调度器`)
  } catch (error) {
    logger.error(`❌ 加载任务失败: ${error}`)
  }
}
