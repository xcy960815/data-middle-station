import { ScheduledEmailMapper } from '../mapper/scheduledEmailMapper'
import { ScheduledEmailService } from './scheduledEmailService'

const logger = new Logger({ fileName: 'advanced-scheduler', folderName: 'server' })

/**
 * 高级调度器 - 实现毫秒级精度的邮件调度
 */
export class AdvancedScheduler {
  private scheduledEmailService: ScheduledEmailService
  private scheduledEmailMapper: ScheduledEmailMapper
  private timers: Map<number, NodeJS.Timeout> = new Map()
  private isRunning: boolean = false

  constructor() {
    this.scheduledEmailService = new ScheduledEmailService()
    this.scheduledEmailMapper = new ScheduledEmailMapper()
  }

  /**
   * 启动高级调度器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('高级调度器已在运行中')
      return
    }

    this.isRunning = true
    logger.info('高级调度器启动')

    // 每分钟扫描一次待调度任务
    setInterval(() => {
      this.scanAndScheduleTasks()
    }, 60000)

    // 立即扫描一次
    await this.scanAndScheduleTasks()
  }

  /**
   * 停止高级调度器
   */
  stop(): void {
    this.isRunning = false

    // 清除所有定时器
    this.timers.forEach((timer) => {
      clearTimeout(timer)
    })
    this.timers.clear()

    logger.info('高级调度器已停止')
  }

  /**
   * 扫描并调度任务
   */
  private async scanAndScheduleTasks(): Promise<void> {
    try {
      const now = new Date()
      const futureTime = new Date(now.getTime() + 5 * 60 * 1000) // 未来5分钟

      const tasks = await this.scheduledEmailMapper.getExactTimeTasks(
        now.toISOString().slice(0, 19).replace('T', ' '),
        futureTime.toISOString().slice(0, 19).replace('T', ' ')
      )

      logger.info(`扫描到 ${tasks.length} 个待调度任务`)

      for (const task of tasks) {
        await this.scheduleTask(task)
      }
    } catch (error) {
      logger.error(`扫描任务失败: ${error}`)
    }
  }

  /**
   * 调度单个任务
   */
  private async scheduleTask(task: ScheduledEmailDao.ScheduledEmailOptions): Promise<void> {
    const taskId = task.id
    const scheduleTime = new Date(task.schedule_time)
    const now = new Date()
    const delay = scheduleTime.getTime() - now.getTime()

    // 如果任务已经过期，立即执行
    if (delay <= 0) {
      logger.info(`任务 ${taskId} 已过期，立即执行`)
      await this.scheduledEmailService.executeTask(taskId)
      return
    }

    // 如果任务在未来5分钟内，设置精确定时器
    if (delay <= 5 * 60 * 1000) {
      // 清除已存在的定时器
      if (this.timers.has(taskId)) {
        clearTimeout(this.timers.get(taskId)!)
      }

      // 设置新的定时器
      const timer = setTimeout(async () => {
        try {
          logger.info(`执行精确调度任务: ${taskId}`)
          await this.scheduledEmailService.executeTask(taskId)
          this.timers.delete(taskId)
        } catch (error) {
          logger.error(`执行任务失败: ${taskId}, ${error}`)
        }
      }, delay)

      this.timers.set(taskId, timer)
      logger.info(`任务 ${taskId} 已调度，将在 ${delay}ms 后执行`)
    }
  }

  /**
   * 取消任务调度
   */
  cancelTask(taskId: number): void {
    if (this.timers.has(taskId)) {
      clearTimeout(this.timers.get(taskId)!)
      this.timers.delete(taskId)
      logger.info(`任务 ${taskId} 调度已取消`)
    }
  }

  /**
   * 获取调度状态
   */
  getStatus(): { isRunning: boolean; scheduledTasks: number } {
    return {
      isRunning: this.isRunning,
      scheduledTasks: this.timers.size
    }
  }
}
