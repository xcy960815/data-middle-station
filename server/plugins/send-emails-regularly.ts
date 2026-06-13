import { getScheduledEmailService } from '@/server/features/email/service/scheduledEmailService'
import {
  configureScheduledEmailScheduler,
  clearScheduledEmailJobs,
  getScheduledEmailJobCount,
  syncScheduledEmailJobs
} from '@/server/features/email/scheduler/scheduledEmailScheduler'
import { Logger } from '@/server/utils/logger'
import schedule from 'node-schedule'

/**
 * 邮件调度业务服务实例
 * @type {ScheduledEmailService}
 */
const scheduledEmailService = getScheduledEmailService()

/**
 * 邮件调度插件专用日志实例
 * @type {Logger}
 */
const logger = new Logger({
  fileName: 'send-emails-regularly',
  folderName: 'plugins'
})

/**
 * 卡死(running)任务的回收阈值（分钟）
 * 超过该时长仍处于 running 状态的任务，被视为僵尸任务并自动回收
 * @type {number}
 */
const STALE_RUNNING_THRESHOLD_MINUTES = Number(process.env.SCHEDULED_EMAIL_RUNNING_TIMEOUT_MINUTES || 10)

/**
 * 僵尸任务回收周期（分钟）
 * @type {number}
 */
const STALE_RUNNING_RECOVERY_INTERVAL_MINUTES = Number(process.env.SCHEDULED_EMAIL_RECOVERY_INTERVAL_MINUTES || 5)

/**
 * 定时邮件发送调度插件（基于 node-schedule）
 * 优势：
 * 1. 零轮询，按需触发，资源消耗低
 * 2. 支持秒级精度
 * 3. 内存调度，无数据库压力
 * 4. 性能随任务数量线性增长
 *
 * 支持两种类型的任务：
 * 1. scheduled - 定时任务：在指定时间执行一次
 * 2. recurring - 重复任务：按照指定的周期和时间重复执行
 *
 * @param {NitroApp} nitroApp Nitro 应用对象
 * @returns {Promise<void>}
 */
export default defineNitroPlugin(async (nitroApp) => {
  logger.info('📧 邮件发送调度系统初始化中...')
  logger.info('🔧 调度引擎: node-schedule')

  configureScheduledEmailScheduler(async (task) => {
    const success = await scheduledEmailService.executeTaskByQuery({ id: task.id })
    if (success) {
      logger.info(`✅ 任务 ${task.id} 执行成功`)
    } else {
      logger.error(`❌ 任务 ${task.id} 执行失败`)
    }
  })

  // 启动时先回收上次运行残留的卡死任务，避免 loadAndScheduleAllTasks 跳过它们
  await recoverStaleRunningTasksSafely('启动')

  // 加载所有待执行的任务并注册到调度器
  await loadAndScheduleAllTasks()

  // 每5分钟检查一次失败任务的重试
  const retryFailedTasksJob = schedule.scheduleJob('*/5 * * * *', async () => {
    try {
      logger.info('🔄 开始检查需要重试的失败任务...')
      await scheduledEmailService.retryFailedTasks()
    } catch (error) {
      logger.error(`❌ 重试失败任务失败: ${error}`)
    }
  })

  // 周期回收卡死(running)任务：进程崩溃 / 容器重启等场景下任务会永远停留在 running 状态
  const recoveryCron = `*/${STALE_RUNNING_RECOVERY_INTERVAL_MINUTES} * * * *`
  const staleRunningRecoveryJob = schedule.scheduleJob(recoveryCron, async () => {
    await recoverStaleRunningTasksSafely('周期')
  })

  // 每小时同步一次数据库任务状态（防止任务漏执行）
  const syncTasksJob = schedule.scheduleJob('0 * * * *', async () => {
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
  logger.info(
    `  - 每${STALE_RUNNING_RECOVERY_INTERVAL_MINUTES}分钟回收卡死任务（阈值 ${STALE_RUNNING_THRESHOLD_MINUTES} 分钟）`
  )
  logger.info('  - 每小时同步数据库任务状态')

  nitroApp.hooks.hook('close', () => {
    retryFailedTasksJob?.cancel()
    staleRunningRecoveryJob?.cancel()
    syncTasksJob?.cancel()
    clearScheduledEmailJobs()
    logger.info('邮件发送调度系统已停止')
  })
})

/**
 * 安全地执行一次僵尸任务回收（捕获所有异常，避免影响调用方）
 * @param {string} trigger 触发类型名称，例如 "启动" 或 "周期"
 * @returns {Promise<void>}
 */
const recoverStaleRunningTasksSafely = async (trigger: string): Promise<void> => {
  try {
    const recoveredCount = await scheduledEmailService.recoverStaleRunningTasks(STALE_RUNNING_THRESHOLD_MINUTES)
    if (recoveredCount > 0) {
      logger.warn(`🩺 [${trigger}回收] 共回收 ${recoveredCount} 个僵尸任务`)
    }
  } catch (error) {
    logger.error(`❌ [${trigger}回收] 僵尸任务回收异常: ${error}`)
  }
}

/**
 * 加载所有待执行任务并注册到 node-schedule 调度引擎中
 * @returns {Promise<void>}
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
