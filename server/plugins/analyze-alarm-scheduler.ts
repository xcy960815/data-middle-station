import { getAnalyzeAlarmService } from '@/server/service/analyzeAlarmService'
import { Logger } from '@/server/utils/logger'
import schedule from 'node-schedule'

/**
 * 报警服务实例
 * @type {AnalyzeAlarmService}
 */
const analyzeAlarmService = getAnalyzeAlarmService()

/**
 * 报警调度系统专用日志实例
 * @type {Logger}
 */
const logger = new Logger({ fileName: 'analyze-alarm-scheduler', folderName: 'plugins' })

/**
 * 存储内存中的 Job (键为 alarm.id，值为 schedule.Job)
 * @type {Map<number, schedule.Job>}
 */
const scheduledJobs = new Map<number, schedule.Job>()

/**
 * 正在执行中的报警检测集合（防止同一个 alarmId 并发执行）
 * @type {Set<number>}
 */
const runningEvaluations = new Set<number>()

/**
 * 新增或更新单个报警任务的调度
 * @param {AnalyzeAlarmDao.AnalyzeAlarmRecord} alarm 报警规则记录
 * @returns {void}
 */
export const upsertAlarmJob = (alarm: AnalyzeAlarmDao.AnalyzeAlarmRecord) => {
  const existingJob = scheduledJobs.get(alarm.id)
  if (existingJob) {
    existingJob.cancel()
    scheduledJobs.delete(alarm.id)
  }

  if (alarm.isActive === 1) {
    try {
      const job = schedule.scheduleJob(alarm.cronExpression, async () => {
        if (runningEvaluations.has(alarm.id)) {
          logger.info(`[Alarm ${alarm.id}] 上一次检测尚未完成，跳过本次`)
          return
        }
        runningEvaluations.add(alarm.id)
        try {
          logger.info(`[Alarm ${alarm.id}] 正在执行报警检测: ${alarm.alarmName}`)
          await analyzeAlarmService.evaluateAlarm(alarm)
        } finally {
          runningEvaluations.delete(alarm.id)
        }
      })
      if (job) {
        scheduledJobs.set(alarm.id, job)
        logger.info(`[Alarm ${alarm.id}] 调度成功, 规则: ${alarm.cronExpression}`)
      }
    } catch (err: any) {
      logger.error(`[Alarm ${alarm.id}] 调度失败 (规则: ${alarm.cronExpression}): ${err.message}`)
    }
  }
}

/**
 * 移除报警任务的调度并取消 Job
 * @param {number} alarmId 报警规则 ID
 * @returns {void}
 */
export const removeAlarmJob = (alarmId: number) => {
  const job = scheduledJobs.get(alarmId)
  if (job) {
    job.cancel()
    scheduledJobs.delete(alarmId)
    logger.info(`[Alarm ${alarmId}] 调度已取消`)
  }
}

/**
 * 注册报警调度系统插件，在应用启动时加载已启用的报警规则并定期同步状态
 * @param {NitroApp} nitroApp Nitro 应用对象
 * @returns {Promise<void>}
 */
export default defineNitroPlugin(async (nitroApp) => {
  logger.info('🔔 报警调度系统初始化中...')

  try {
    // 启动时加载所有激活的报警规则
    const activeAlarms = await analyzeAlarmService.getAlarms({ isActive: 1 })
    logger.info(`📦 从数据库加载了 ${activeAlarms.length} 个启用的报警规则`)

    activeAlarms.forEach(upsertAlarmJob)
    logger.info(`✅ 成功注册 ${scheduledJobs.size} 个报警调度任务`)
  } catch (error) {
    logger.error(`❌ 加载报警规则失败: ${error}`)
  }

  // 每小时全量同步一次，防止内存状态与 DB 偏差
  const syncJob = schedule.scheduleJob('0 * * * *', async () => {
    try {
      logger.info('🔄 同步数据库报警状态...')
      const activeAlarms = await analyzeAlarmService.getAlarms({ isActive: 1 })

      // 清理已在数据库中删除或停用的任务
      const activeIds = new Set(activeAlarms.map((a) => a.id))
      for (const [id, job] of scheduledJobs.entries()) {
        if (!activeIds.has(id)) {
          job.cancel()
          scheduledJobs.delete(id)
        }
      }

      // 重新注册活跃任务
      activeAlarms.forEach(upsertAlarmJob)
    } catch (error) {
      logger.error(`❌ 同步报警任务失败: ${error}`)
    }
  })

  nitroApp.hooks.hook('close', () => {
    syncJob?.cancel()
    for (const job of scheduledJobs.values()) {
      job.cancel()
    }
    scheduledJobs.clear()
    runningEvaluations.clear()
    logger.info('报警调度系统已停止')
  })
})
