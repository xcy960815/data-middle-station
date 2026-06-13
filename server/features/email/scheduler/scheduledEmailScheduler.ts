import { shouldScheduleTask, TaskType } from '../domain/scheduledEmailDomain'
import schedule from 'node-schedule'

/**
 * 定时任务实际执行器函数的类型定义
 * @callback ScheduledTaskExecutor
 * @param {ScheduledEmailVo.ScheduledEmailTaskResponse} task 定时邮件任务对象
 * @returns {Promise<void>}
 */
type ScheduledTaskExecutor = (task: ScheduledEmailVo.ScheduledEmailTaskResponse) => Promise<void>

/**
 * 调度器日志记录器实例
 * @type {Logger}
 */
const logger = new Logger({
  fileName: 'scheduled-email-scheduler',
  folderName: 'server'
})

/**
 * 内存中维护的已注册的定时邮件调度任务映射表 (以任务 ID 为键)
 * @type {Map<number, schedule.Job>}
 */
const scheduledJobs = new Map<number, schedule.Job>()

/**
 * 全局持有的定时邮件任务执行器
 * @type {ScheduledTaskExecutor | null}
 */
let scheduledTaskExecutor: ScheduledTaskExecutor | null = null

/**
 * 格式化星期数组为友好的中文字符串（如 [1, 3] 转为 "周一、周三"）
 * @param {number[]} dayNumbers 星期数字数组 (0为周日，1-6为周一至周六)
 * @returns {string} 格式化后的星期字符串描述
 */
const formatDays = (dayNumbers: number[]): string => {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return dayNumbers.map((dayIndex) => dayNames[dayIndex]).join('、')
}

/**
 * 执行定时任务的核心方法，内部调用已配置的执行器并捕获可能的异常
 * @param {ScheduledEmailVo.ScheduledEmailTaskResponse} task 待执行的任务对象
 * @returns {Promise<void>}
 */
const executeTask = async (task: ScheduledEmailVo.ScheduledEmailTaskResponse): Promise<void> => {
  if (!scheduledTaskExecutor) {
    logger.error(`任务 ${task.id} 缺少执行器，跳过执行`)
    return
  }

  try {
    await scheduledTaskExecutor(task)
  } catch (error) {
    logger.error(`任务 ${task.id} 执行异常: ${error}`)
  }
}

/**
 * 调度单次（一次性）执行的定时邮件任务
 * @param {ScheduledEmailVo.ScheduledEmailTaskResponse} task 一次性邮件任务对象
 * @returns {void}
 */
const scheduleOnceTask = (task: ScheduledEmailVo.ScheduledEmailTaskResponse): void => {
  if (!task.scheduleTime) {
    logger.error(`任务 ${task.id} 缺少执行时间`)
    return
  }

  const executeTime = new Date(task.scheduleTime)
  const now = new Date()

  if (Number.isNaN(executeTime.getTime())) {
    logger.error(`任务 ${task.id} 的执行时间无效: ${task.scheduleTime}`)
    return
  }

  if (executeTime <= now) {
    logger.warn(`任务 ${task.id} 的执行时间已过期: ${task.scheduleTime}，立即执行`)
    void executeTask(task)
    return
  }

  const job = schedule.scheduleJob(executeTime, async () => {
    logger.info(`执行定时任务: ${task.id} - ${task.taskName}`)
    await executeTask(task)
    removeScheduledEmailJob(task.id)
  })

  if (job) {
    scheduledJobs.set(task.id, job)
    logger.info(`定时任务已注册: ${task.id} - ${task.taskName}, 执行时间: ${task.scheduleTime}`)
  }
}

/**
 * 调度循环/重复执行的定时邮件任务（根据周几和时间构建 cron 表达式）
 * @param {ScheduledEmailVo.ScheduledEmailTaskResponse} task 循环邮件任务对象
 * @returns {void}
 */
const scheduleRecurringTask = (task: ScheduledEmailVo.ScheduledEmailTaskResponse): void => {
  if (!task.recurringDays || !task.recurringTime) {
    logger.error(`任务 ${task.id} 缺少重复配置`)
    return
  }

  let cronExpression: string

  if (task.recurringTime.startsWith('*/')) {
    const intervalMinutes = task.recurringTime.substring(2)
    cronExpression = `0 ${task.recurringTime} * * * *`
    logger.info(`构建高频 cron 表达式: ${cronExpression} (每${intervalMinutes}分钟执行)`)
  } else {
    const timeComponents = task.recurringTime.split(':')
    const hour = parseInt(timeComponents[0])
    const minute = parseInt(timeComponents[1])
    const second = timeComponents[2] ? parseInt(timeComponents[2]) : 0
    const dayOfWeek = task.recurringDays.join(',')
    cronExpression = `${second} ${minute} ${hour} * * ${dayOfWeek}`
  }

  try {
    const job = schedule.scheduleJob(cronExpression, async () => {
      logger.info(`执行重复任务: ${task.id} - ${task.taskName}`)
      await executeTask(task)
    })

    if (job) {
      scheduledJobs.set(task.id, job)
      const nextInvocation = job.nextInvocation()
      logger.info(
        `重复任务已注册: ${task.id} - ${task.taskName}, ` +
          `执行周期: ${formatDays(task.recurringDays)} ${task.recurringTime}, ` +
          `下次执行: ${nextInvocation?.toLocaleString('zh-CN')}`
      )
    } else {
      logger.error(`任务 ${task.id} 的 cron 表达式无效，无法创建调度: ${cronExpression}`)
    }
  } catch (error) {
    logger.error(`创建重复任务调度失败: ${task.id} - ${task.taskName}, 错误: ${error}`)
  }
}

/**
 * 配置定时邮件任务执行器
 * @param {ScheduledTaskExecutor} taskExecutor 定时任务执行的逻辑回调函数
 * @returns {void}
 */
export const configureScheduledEmailScheduler = (taskExecutor: ScheduledTaskExecutor): void => {
  scheduledTaskExecutor = taskExecutor
}

/**
 * 从 node-schedule 调度器中移除并取消指定 ID 的定时任务
 * @param {number} taskId 任务 ID
 * @returns {void}
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
 * 新增或更新（覆盖）定时邮件任务在内存中的调度作业
 * @param {ScheduledEmailVo.ScheduledEmailTaskResponse} task 定时邮件任务对象
 * @returns {void}
 */
export const upsertScheduledEmailJob = (task: ScheduledEmailVo.ScheduledEmailTaskResponse): void => {
  removeScheduledEmailJob(task.id)

  if (!shouldScheduleTask(task)) {
    return
  }

  if (task.taskType === TaskType.Scheduled) {
    scheduleOnceTask(task)
    return
  }

  scheduleRecurringTask(task)
}

/**
 * 根据数据库中最新的有效任务列表同步内存中活跃的调度任务
 * @param {ScheduledEmailVo.ScheduledEmailTaskResponse[]} taskList 活跃的任务列表
 * @returns {void}
 */
export const syncScheduledEmailJobs = (taskList: ScheduledEmailVo.ScheduledEmailTaskResponse[]): void => {
  const activeTaskIds = new Set(taskList.map((task) => task.id))

  for (const taskId of scheduledJobs.keys()) {
    if (!activeTaskIds.has(taskId)) {
      removeScheduledEmailJob(taskId)
    }
  }

  for (const task of taskList) {
    upsertScheduledEmailJob(task)
  }
}

/**
 * 获取当前已注册的定时邮件任务数量
 * @returns {number} 内存调度任务总数
 */
export const getScheduledEmailJobCount = (): number => scheduledJobs.size

/**
 * 清理、释放所有已注册的定时邮件调度任务，并释放执行器引用
 * @returns {void}
 */
export const clearScheduledEmailJobs = (): void => {
  for (const [taskId, job] of scheduledJobs.entries()) {
    job.cancel()
    logger.info(`任务 ${taskId} 已从调度器移除`)
  }
  scheduledJobs.clear()
  scheduledTaskExecutor = null
}
