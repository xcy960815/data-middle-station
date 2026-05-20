import { shouldScheduleTask, TaskType } from '@/server/service/scheduledEmailDomain'
import schedule from 'node-schedule'

type ScheduledTaskExecutor = (taskOptions: ScheduledEmailVo.ScheduledEmailOptions) => Promise<void>

const logger = new Logger({
  fileName: 'scheduled-email-scheduler',
  folderName: 'server'
})

const scheduledJobs = new Map<number, schedule.Job>()
let scheduledTaskExecutor: ScheduledTaskExecutor | null = null

const formatDays = (dayNumbers: number[]): string => {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return dayNumbers.map((dayIndex) => dayNames[dayIndex]).join('、')
}

const executeTask = async (taskOptions: ScheduledEmailVo.ScheduledEmailOptions): Promise<void> => {
  if (!scheduledTaskExecutor) {
    logger.error(`任务 ${taskOptions.id} 缺少执行器，跳过执行`)
    return
  }

  try {
    await scheduledTaskExecutor(taskOptions)
  } catch (error) {
    logger.error(`任务 ${taskOptions.id} 执行异常: ${error}`)
  }
}

const scheduleOnceTask = (taskOptions: ScheduledEmailVo.ScheduledEmailOptions): void => {
  if (!taskOptions.scheduleTime) {
    logger.error(`任务 ${taskOptions.id} 缺少执行时间`)
    return
  }

  const executeTime = new Date(taskOptions.scheduleTime)
  const now = new Date()

  if (Number.isNaN(executeTime.getTime())) {
    logger.error(`任务 ${taskOptions.id} 的执行时间无效: ${taskOptions.scheduleTime}`)
    return
  }

  if (executeTime <= now) {
    logger.warn(`任务 ${taskOptions.id} 的执行时间已过期: ${taskOptions.scheduleTime}，立即执行`)
    void executeTask(taskOptions)
    return
  }

  const job = schedule.scheduleJob(executeTime, async () => {
    logger.info(`执行定时任务: ${taskOptions.id} - ${taskOptions.taskName}`)
    await executeTask(taskOptions)
    removeScheduledEmailJob(taskOptions.id)
  })

  if (job) {
    scheduledJobs.set(taskOptions.id, job)
    logger.info(`定时任务已注册: ${taskOptions.id} - ${taskOptions.taskName}, 执行时间: ${taskOptions.scheduleTime}`)
  }
}

const scheduleRecurringTask = (taskOptions: ScheduledEmailVo.ScheduledEmailOptions): void => {
  if (!taskOptions.recurringDays || !taskOptions.recurringTime) {
    logger.error(`任务 ${taskOptions.id} 缺少重复配置`)
    return
  }

  let cronExpression: string

  if (taskOptions.recurringTime.startsWith('*/')) {
    const intervalMinutes = taskOptions.recurringTime.substring(2)
    cronExpression = `0 ${taskOptions.recurringTime} * * * *`
    logger.info(`构建高频 cron 表达式: ${cronExpression} (每${intervalMinutes}分钟执行)`)
  } else {
    const timeComponents = taskOptions.recurringTime.split(':')
    const hour = parseInt(timeComponents[0])
    const minute = parseInt(timeComponents[1])
    const second = timeComponents[2] ? parseInt(timeComponents[2]) : 0
    const dayOfWeek = taskOptions.recurringDays.join(',')
    cronExpression = `${second} ${minute} ${hour} * * ${dayOfWeek}`
  }

  try {
    const job = schedule.scheduleJob(cronExpression, async () => {
      logger.info(`执行重复任务: ${taskOptions.id} - ${taskOptions.taskName}`)
      await executeTask(taskOptions)
    })

    if (job) {
      scheduledJobs.set(taskOptions.id, job)
      const nextInvocation = job.nextInvocation()
      logger.info(
        `重复任务已注册: ${taskOptions.id} - ${taskOptions.taskName}, ` +
          `执行周期: ${formatDays(taskOptions.recurringDays)} ${taskOptions.recurringTime}, ` +
          `下次执行: ${nextInvocation?.toLocaleString('zh-CN')}`
      )
    } else {
      logger.error(`任务 ${taskOptions.id} 的 cron 表达式无效，无法创建调度: ${cronExpression}`)
    }
  } catch (error) {
    logger.error(`创建重复任务调度失败: ${taskOptions.id} - ${taskOptions.taskName}, 错误: ${error}`)
  }
}

/**
 * @desc 配置定时邮件任务执行器。
 */
export const configureScheduledEmailScheduler = (taskExecutor: ScheduledTaskExecutor): void => {
  scheduledTaskExecutor = taskExecutor
}

/**
 * @desc 从调度器中移除指定邮件任务。
 */
export const removeScheduledEmailJob = (taskId: number): void => {
  const job = scheduledJobs.get(taskId)
  if (job) {
    job.cancel()
    scheduledJobs.delete(taskId)
    logger.info(`任务 ${taskId} 已从调度器移除`)
  }
}

/**
 * @desc 新增或更新定时邮件任务的调度。
 */
export const upsertScheduledEmailJob = (taskOptions: ScheduledEmailVo.ScheduledEmailOptions): void => {
  removeScheduledEmailJob(taskOptions.id)

  if (!shouldScheduleTask(taskOptions)) {
    return
  }

  if (taskOptions.taskType === TaskType.Scheduled) {
    scheduleOnceTask(taskOptions)
    return
  }

  scheduleRecurringTask(taskOptions)
}

/**
 * @desc 根据数据库任务列表同步内存中的调度任务。
 */
export const syncScheduledEmailJobs = (taskOptionsList: ScheduledEmailVo.ScheduledEmailOptions[]): void => {
  const activeTaskIds = new Set(taskOptionsList.map((taskOptions) => taskOptions.id))

  for (const taskId of scheduledJobs.keys()) {
    if (!activeTaskIds.has(taskId)) {
      removeScheduledEmailJob(taskId)
    }
  }

  for (const taskOptions of taskOptionsList) {
    upsertScheduledEmailJob(taskOptions)
  }
}

/**
 * @desc 获取当前已注册的定时邮件任务数量。
 */
export const getScheduledEmailJobCount = (): number => scheduledJobs.size

/**
 * @desc 清理所有定时邮件调度任务。
 */
export const clearScheduledEmailJobs = (): void => {
  for (const [taskId, job] of scheduledJobs.entries()) {
    job.cancel()
    logger.info(`任务 ${taskId} 已从调度器移除`)
  }
  scheduledJobs.clear()
  scheduledTaskExecutor = null
}
