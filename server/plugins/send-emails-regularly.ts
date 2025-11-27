import { ScheduledEmailService } from '@/server/service/scheduledEmailService'
import schedule from 'node-schedule'

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
const loadAndScheduleAllTasks = async (): Promise<void> => {
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
 * @param {ScheduledEmailVo.ScheduledEmailResponse} task 任务选项
 * @returns {void}
 */
const scheduleOnceTask = (task: ScheduledEmailVo.ScheduledEmailResponse): void => {
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
 * @param {ScheduledEmailVo.ScheduledEmailResponse} task 任务选项
 * @returns {void}
 */
const scheduleRecurringTask = (task: ScheduledEmailVo.ScheduledEmailResponse): void => {
  if (!task.recurringDays || !task.recurringTime) {
    logger.error(`❌ 任务 ${task.id} 缺少重复配置`)
    return
  }

  let cronExpression: string

  // 检查是否是高频执行格式（如 "*/1" 表示每1分钟）
  if (task.recurringTime.startsWith('*/')) {
    // 高频执行模式：*/N 表示每N分钟执行一次
    const interval = task.recurringTime.substring(2)
    const dayOfWeek = task.recurringDays.join(',')
    // cron 格式: 秒 分 时 日 月 星期
    // 例如: "0 */1 * * * *" = 每1分钟执行
    cronExpression = `0 ${task.recurringTime} * * * ${dayOfWeek}`
    logger.info(`🔧 构建高频 cron 表达式: ${cronExpression} (每${interval}分钟执行)`)
  } else {
    // 标准时间格式 HH:mm:ss
    const timeParts = task.recurringTime.split(':')
    const hour = parseInt(timeParts[0])
    const minute = parseInt(timeParts[1])
    const second = timeParts[2] ? parseInt(timeParts[2]) : 0

    // 构建 cron 表达式
    // 格式: 秒 分 时 日 月 星期
    // 例如: "0 30 9 * * 1,3,5" = 每周一、三、五的 9:30:00
    const dayOfWeek = task.recurringDays.join(',')
    cronExpression = `${second} ${minute} ${hour} * * ${dayOfWeek}`
    logger.info(`🔧 构建 cron 表达式: ${cronExpression} (${task.taskName})`)
  }

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
 * @param {ScheduledEmailVo.ScheduledEmailResponse} task 任务选项
 * @returns {Promise<void>}
 */
const executeTask = async (task: ScheduledEmailVo.ScheduledEmailResponse): Promise<void> => {
  try {
    const success = await scheduledEmailService.executeTaskWithOptions({ id: task.id })
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
 * @param {number[]} days 星期数组
 * @returns {string} 格式化后的星期字符串
 */
const formatDays = (days: number[]): string => {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days.map((d) => dayNames[d]).join('、')
}
