import schedule from 'node-schedule'
import { ScheduledEmailService } from '../service/scheduledEmailService'

const scheduledEmailService = new ScheduledEmailService()

const logger = new Logger({
  fileName: 'send-emails-regularly',
  folderName: 'plugins'
})

/**
 * 任务调度器映射表
 * key: taskId, value: node-schedule Job 实例
 */
const scheduledJobs = new Map<number, schedule.Job>()

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
  logger.info(`  - 已加载 ${scheduledJobs.size} 个任务到调度器`)
  logger.info('  - 每5分钟检查失败任务重试')
  logger.info('  - 每小时同步数据库任务状态')
})

/**
 * 加载所有待执行任务并注册到 node-schedule
 */
async function loadAndScheduleAllTasks(): Promise<void> {
  try {
    // 获取所有待执行的任务
    const pendingTasks = await scheduledEmailService.getScheduledEmailList({
      status: 'pending'
    })

    logger.info(`📦 从数据库加载了 ${pendingTasks.length} 个待执行任务`)

    // 清理已存在的调度任务（避免重复注册）
    for (const [taskId, job] of scheduledJobs.entries()) {
      const taskExists = pendingTasks.some((task) => task.id === taskId)
      if (!taskExists) {
        job.cancel()
        scheduledJobs.delete(taskId)
        logger.info(`🗑️ 移除已完成或取消的任务: ${taskId}`)
      }
    }

    // 为每个任务创建调度
    for (const task of pendingTasks) {
      // 跳过未激活的任务
      if (!task.isActive) {
        continue
      }

      // 如果任务已经在调度器中，先取消
      if (scheduledJobs.has(task.id)) {
        scheduledJobs.get(task.id)?.cancel()
        scheduledJobs.delete(task.id)
      }

      // 根据任务类型创建调度
      if (task.taskType === 'scheduled') {
        scheduleOnceTask(task)
      } else if (task.taskType === 'recurring') {
        scheduleRecurringTask(task)
      }
    }

    logger.info(`✅ 成功加载 ${scheduledJobs.size} 个任务到调度器`)
  } catch (error) {
    logger.error(`❌ 加载任务失败: ${error}`)
  }
}

/**
 * 调度一次性任务（scheduled）
 */
function scheduleOnceTask(task: ScheduledEmailVo.ScheduledEmailOptions): void {
  if (!task.scheduleTime) {
    logger.error(`❌ 任务 ${task.id} 缺少执行时间`)
    return
  }

  const executeTime = new Date(task.scheduleTime)
  const now = new Date()

  // 检查时间是否已过期
  if (executeTime <= now) {
    logger.warn(`⚠️ 任务 ${task.id} 的执行时间已过期: ${task.scheduleTime}`)
    return
  }

  // 创建一次性调度任务
  const job = schedule.scheduleJob(executeTime, async () => {
    logger.info(`🚀 执行定时任务: ${task.id} - ${task.taskName}`)
    await executeTask(task)
  })

  if (job) {
    scheduledJobs.set(task.id, job)
    logger.info(`📅 定时任务已注册: ${task.id} - ${task.taskName}, 执行时间: ${task.scheduleTime}`)
  }
}

/**
 * 调度重复任务（recurring）
 */
function scheduleRecurringTask(task: ScheduledEmailVo.ScheduledEmailOptions): void {
  if (!task.recurringDays || !task.recurringTime) {
    logger.error(`❌ 任务 ${task.id} 缺少重复配置`)
    return
  }

  // 解析时间 HH:mm:ss
  const timeParts = task.recurringTime.split(':')
  const hour = parseInt(timeParts[0])
  const minute = parseInt(timeParts[1])
  const second = timeParts[2] ? parseInt(timeParts[2]) : 0

  // 构建 cron 表达式
  // 格式: 秒 分 时 日 月 星期
  // 例如: "0 30 9 * * 1,3,5" = 每周一、三、五的 9:30:00
  const dayOfWeek = task.recurringDays.join(',')
  const cronExpression = `${second} ${minute} ${hour} * * ${dayOfWeek}`

  logger.info(`🔧 构建 cron 表达式: ${cronExpression} (${task.taskName})`)

  // 创建重复调度任务
  const job = schedule.scheduleJob(cronExpression, async () => {
    logger.info(`🚀 执行重复任务: ${task.id} - ${task.taskName}`)
    await executeTask(task)
  })

  if (job) {
    scheduledJobs.set(task.id, job)
    const nextInvocation = job.nextInvocation()
    logger.info(
      `🔄 重复任务已注册: ${task.id} - ${task.taskName}, ` +
        `执行周期: ${formatDays(task.recurringDays)} ${task.recurringTime}, ` +
        `下次执行: ${nextInvocation?.toLocaleString('zh-CN')}`
    )
  }
}

/**
 * 执行任务
 */
async function executeTask(task: ScheduledEmailVo.ScheduledEmailOptions): Promise<void> {
  try {
    const success = await scheduledEmailService.executeTaskById(task.id)

    if (success) {
      logger.info(`✅ 任务 ${task.id} 执行成功`)

      // 如果是一次性任务，执行后从调度器中移除
      if (task.taskType === 'scheduled') {
        const job = scheduledJobs.get(task.id)
        if (job) {
          job.cancel()
          scheduledJobs.delete(task.id)
          logger.info(`🗑️ 一次性任务 ${task.id} 已从调度器移除`)
        }
      }
    } else {
      logger.error(`❌ 任务 ${task.id} 执行失败`)
    }
  } catch (error) {
    logger.error(`❌ 任务 ${task.id} 执行异常: ${error}`)
  }
}

/**
 * 格式化星期显示
 */
function formatDays(days: number[]): string {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days.map((d) => dayNames[d]).join('、')
}

/**
 * 动态添加任务到调度器（供外部调用）
 */
export function addTaskToScheduler(task: ScheduledEmailVo.ScheduledEmailOptions): void {
  if (task.taskType === 'scheduled') {
    scheduleOnceTask(task)
  } else if (task.taskType === 'recurring') {
    scheduleRecurringTask(task)
  }
}

/**
 * 从调度器移除任务（供外部调用）
 */
export function removeTaskFromScheduler(taskId: number): void {
  const job = scheduledJobs.get(taskId)
  if (job) {
    job.cancel()
    scheduledJobs.delete(taskId)
    logger.info(`🗑️ 任务 ${taskId} 已从调度器移除`)
  }
}

/**
 * 获取当前调度器中的任务数量
 */
export function getScheduledTaskCount(): number {
  return scheduledJobs.size
}
