import { ScheduledEmailExecutionService } from '@/server/service/scheduledEmailExecutionService'
import { ScheduledEmailTaskService } from '@/server/service/scheduledEmailTaskService'

/**
 * 定时邮件服务外观层。
 * 对外继续保留原有入口，内部拆分为任务管理与任务执行两个子服务。
 */
export class ScheduledEmailService {
  private taskService: ScheduledEmailTaskService
  private executionService: ScheduledEmailExecutionService

  constructor() {
    this.taskService = new ScheduledEmailTaskService()
    this.executionService = new ScheduledEmailExecutionService()
  }

  async createScheduledEmailTask(createOptions: ScheduledEmailDto.CreateScheduledEmailOptions): Promise<boolean> {
    return this.taskService.createScheduledEmailTask(createOptions)
  }

  async getScheduledEmailTask(
    queryOptions: ScheduledEmailDto.GetScheduledEmailOptions
  ): Promise<ScheduledEmailVo.ScheduledEmailOptions | null> {
    return this.taskService.getScheduledEmailTask(queryOptions)
  }

  async updateScheduledEmailTask(updateOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    return this.taskService.updateScheduledEmailTask(updateOptions)
  }

  async deleteScheduledEmailTask(deleteOptions: ScheduledEmailDto.DeleteScheduledEmailOptions): Promise<boolean> {
    return this.taskService.deleteScheduledEmailTask(deleteOptions)
  }

  async getScheduledEmailTaskList(
    scheduledEmailListQuery: ScheduledEmailDto.ScheduledEmailListQuery
  ): Promise<ScheduledEmailVo.ScheduledEmailOptions[]> {
    return this.taskService.getScheduledEmailTaskList(scheduledEmailListQuery)
  }

  async toggleTaskStatus(toggleOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    return this.taskService.toggleTaskStatus(toggleOptions)
  }

  async executeTask(executeOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    return this.executionService.executeTask(executeOptions)
  }

  async executeTaskWithOptions(queryOptions: ScheduledEmailDto.ScheduledEmailQueryOptions): Promise<boolean> {
    return this.executionService.executeTaskWithOptions(queryOptions)
  }

  async processPendingTasks(): Promise<void> {
    return this.executionService.processPendingTasks()
  }

  async processExactTimeTasks(): Promise<void> {
    return this.executionService.processExactTimeTasks()
  }

  async retryFailedTasks(): Promise<void> {
    return this.executionService.retryFailedTasks()
  }

  async updateNextExecutionTimeTask(queryOptions: ScheduledEmailDto.ScheduledEmailQueryOptions): Promise<boolean> {
    return this.executionService.updateNextExecutionTimeTask(queryOptions)
  }

  async getScheduledEmailLogList(
    queryOptions: ScheduledEmailLogDto.LogListQuery
  ): Promise<ScheduledEmailDto.ExecutionLog[]> {
    return this.executionService.getScheduledEmailLogList(queryOptions)
  }
}
