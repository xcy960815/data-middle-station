import { ScheduledEmailService } from '@/server/service/scheduledEmailService'
import { Logger } from '@/server/utils/logger'
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
 * @description 这里不会只盯着 pending，而是先加载活跃任务，再按任务类型筛选真正可调度的集合，
 * 这样重复任务在失败重试或服务重启后不会丢失调度。
 */
const loadAndScheduleAllTasks = async (): Promise<void> => {
  try {
    // 获取所有活跃任务，再按任务类型过滤可调度状态
    const activeTasks = await scheduledEmailService.getScheduledEmailTaskList({
      isActive: true,
      limit: 1000
    })
    const schedulableTasks = activeTasks.filter((taskOptions) => {
      if (taskOptions.status === 'cancelled' || taskOptions.status === 'completed') {
        return false
      }

      if (taskOptions.taskType === 'scheduled') {
        return taskOptions.status === 'pending'
      }

      return true
    })

    logger.info(`📦 从数据库加载了 ${activeTasks.length} 个活跃任务，其中 ${schedulableTasks.length} 个可调度`)

    // 清理已存在的调度任务（避免重复注册）
    for (const [taskId, job] of scheduledJobs.entries()) {
      const taskExists = schedulableTasks.some((taskOptions) => taskOptions.id === taskId)
      if (!taskExists) {
        job.cancel()
        scheduledJobs.delete(taskId)
        logger.info(`🗑️ 移除已完成或取消的任务: ${taskId}`)
      }
    }

    // 为每个任务创建调度
    for (const taskOptions of schedulableTasks) {
      // 如果任务已经在调度器中，先取消
      if (scheduledJobs.has(taskOptions.id)) {
        scheduledJobs.get(taskOptions.id)?.cancel()
        scheduledJobs.delete(taskOptions.id)
      }

      // 根据任务类型创建调度
      if (taskOptions.taskType === 'scheduled') {
        scheduleOnceTask(taskOptions)
      } else if (taskOptions.taskType === 'recurring') {
        scheduleRecurringTask(taskOptions)
      }
    }

    logger.info(`✅ 成功加载 ${scheduledJobs.size} 个任务到调度器`)
  } catch (error) {
    logger.error(`❌ 加载任务失败: ${error}`)
  }
}

/**
 * 调度一次性任务（scheduled）
 * @param {ScheduledEmailVo.ScheduledEmailOptions} taskOptions 任务选项
 * @returns {void}
 */
const scheduleOnceTask = (taskOptions: ScheduledEmailVo.ScheduledEmailOptions): void => {
  if (!taskOptions.scheduleTime) {
    logger.error(`❌ 任务 ${taskOptions.id} 缺少执行时间`)
    return
  }

  const executeTime = new Date(taskOptions.scheduleTime)
  const now = new Date()

  // 检查时间是否已过期，如果已过期则立即执行一次性任务
  if (executeTime <= now) {
    logger.warn(`⚠️ 任务 ${taskOptions.id} 的执行时间已过期: ${taskOptions.scheduleTime}，立即执行`)
    // 直接执行任务而不是调度
    executeTask(taskOptions).catch((err) => logger.error(`❌ 立即执行任务 ${taskOptions.id} 失败: ${err}`))
    return
  }

  // 创建一次性调度任务
  const job = schedule.scheduleJob(executeTime, async () => {
    logger.info(`🚀 执行定时任务: ${taskOptions.id} - ${taskOptions.taskName}`)
    await executeTask(taskOptions)
  })

  if (job) {
    scheduledJobs.set(taskOptions.id, job)
    logger.info(`📅 定时任务已注册: ${taskOptions.id} - ${taskOptions.taskName}, 执行时间: ${taskOptions.scheduleTime}`)
  }
}

/**
 * 调度重复任务（recurring）
 * @param {ScheduledEmailVo.ScheduledEmailOptions} taskOptions 任务选项
 * @returns {void}
 */
const scheduleRecurringTask = (taskOptions: ScheduledEmailVo.ScheduledEmailOptions): void => {
  if (!taskOptions.recurringDays || !taskOptions.recurringTime) {
    logger.error(`❌ 任务 ${taskOptions.id} 缺少重复配置`)
    return
  }

  let cronExpression: string

  // 检查是否是高频执行格式（如 "*/1" 表示每1分钟）
  if (taskOptions.recurringTime.startsWith('*/')) {
    // 高频执行模式：*/N 表示每N分钟执行一次
    const intervalMinutes = taskOptions.recurringTime.substring(2)
    // cron 格式: 秒 分 时 日 月 星期
    // 对于高频任务（每N分钟），星期部分使用 * 表示每天
    // 例如: "0 */1 * * * *" = 每1分钟执行（每天）
    cronExpression = `0 ${taskOptions.recurringTime} * * * *`
    logger.info(`🔧 构建高频 cron 表达式: ${cronExpression} (每${intervalMinutes}分钟执行)`)
  } else {
    // 标准时间格式 HH:mm:ss
    const timeComponents = taskOptions.recurringTime.split(':')
    const hour = parseInt(timeComponents[0])
    const minute = parseInt(timeComponents[1])
    const second = timeComponents[2] ? parseInt(timeComponents[2]) : 0

    // 构建 cron 表达式
    // 格式: 秒 分 时 日 月 星期
    // 例如: "0 30 9 * * 1,3,5" = 每周一、三、五的 9:30:00
    const dayOfWeek = taskOptions.recurringDays.join(',')
    cronExpression = `${second} ${minute} ${hour} * * ${dayOfWeek}`
    logger.info(`🔧 构建 cron 表达式: ${cronExpression} (${taskOptions.taskName})`)
  }

  // 创建重复调度任务
  try {
    const job = schedule.scheduleJob(cronExpression, async () => {
      logger.info(`🚀 执行重复任务: ${taskOptions.id} - ${taskOptions.taskName}`)
      await executeTask(taskOptions)
    })

    if (job) {
      scheduledJobs.set(taskOptions.id, job)
      const nextInvocation = job.nextInvocation()
      logger.info(
        `🔄 重复任务已注册: ${taskOptions.id} - ${taskOptions.taskName}, ` +
          `执行周期: ${formatDays(taskOptions.recurringDays)} ${taskOptions.recurringTime}, ` +
          `下次执行: ${nextInvocation?.toLocaleString('zh-CN')}`
      )
    } else {
      logger.error(`❌ 任务 ${taskOptions.id} 的 cron 表达式无效，无法创建调度: ${cronExpression}`)
    }
  } catch (error) {
    logger.error(`❌ 创建重复任务调度失败: ${taskOptions.id} - ${taskOptions.taskName}, 错误: ${error}`)
  }
}

/**
 * 执行任务
 * @param {ScheduledEmailVo.ScheduledEmailOptions} taskOptions 任务选项
 * @returns {Promise<void>}
 * @description 调度器层只负责触发与日志，真正的状态推进仍交由 ScheduledEmailService 统一处理。
 */
const executeTask = async (taskOptions: ScheduledEmailVo.ScheduledEmailOptions): Promise<void> => {
  try {
    const success = await scheduledEmailService.executeTaskWithOptions({ id: taskOptions.id })
    if (success) {
      logger.info(`✅ 任务 ${taskOptions.id} 执行成功`)

      // 如果是一次性任务，执行后从调度器中移除
      if (taskOptions.taskType === 'scheduled') {
        const job = scheduledJobs.get(taskOptions.id)
        if (job) {
          job.cancel()
          scheduledJobs.delete(taskOptions.id)
          logger.info(`🗑️ 一次性任务 ${taskOptions.id} 已从调度器移除`)
        }
      }
    } else {
      logger.error(`❌ 任务 ${taskOptions.id} 执行失败`)
    }
  } catch (error) {
    logger.error(`❌ 任务 ${taskOptions.id} 执行异常: ${error}`)
  }
}

/**
 * 格式化星期显示
 * @param {number[]} dayNumbers 星期数字数组
 * @returns {string} 格式化后的星期字符串
 */
const formatDays = (dayNumbers: number[]): string => {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return dayNumbers.map((dayIndex) => dayNames[dayIndex]).join('、')
}
