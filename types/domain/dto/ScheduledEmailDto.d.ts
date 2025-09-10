declare namespace ScheduledEmailDto {
  /**
   * 创建定时邮件任务请求
   */
  interface CreateScheduledEmailRequest {
    taskName: string
    scheduleTime: string
    emailConfig: {
      to: string | string[]
      cc?: string | string[]
      bcc?: string | string[]
      subject: string
      html?: string
      text?: string
      additionalContent?: string
      attachments?: Array<{
        filename: string
        content: string | Buffer
        contentType?: string
      }>
    }
    chartData?: {
      filename: string
      base64Image: string
      chartType: string
      title?: string
      analyseName?: string
      chartConfig?: any
    }
    remark?: string
    maxRetries?: number
  }

  /**
   * 更新定时邮件任务请求
   */
  interface UpdateScheduledEmailRequest {
    taskName?: string
    scheduleTime?: string
    emailConfig?: {
      to?: string | string[]
      cc?: string | string[]
      bcc?: string | string[]
      subject?: string
      html?: string
      text?: string
      additionalContent?: string
      attachments?: Array<{
        filename: string
        content: string | Buffer
        contentType?: string
      }>
    }
    chartData?: {
      filename: string
      base64Image: string
      chartType: string
      title?: string
      analyseName?: string
      chartConfig?: any
    }
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    remark?: string
    maxRetries?: number
  }

  /**
   * 定时邮件任务选项/响应
   */
  interface ScheduledEmailOption {
    id: number
    taskName: string
    scheduleTime: string
    emailConfig: {
      to: string | string[]
      cc?: string | string[]
      bcc?: string | string[]
      subject: string
      html?: string
      text?: string
      additionalContent?: string
      attachments?: Array<{
        filename: string
        content: string | Buffer
        contentType?: string
      }>
    }
    chartData?: {
      filename: string
      base64Image: string
      chartType: string
      title?: string
      analyseName?: string
      chartConfig?: any
    }
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    remark?: string
    maxRetries: number
    retryCount?: number
    errorMessage?: string
    createdAt: string
    updatedAt?: string
    executedAt?: string
  }

  /**
   * 任务执行日志
   */
  interface ExecutionLog {
    id: number
    task_id: number
    execution_time: string
    status: 'success' | 'failed'
    error_message?: string
    duration?: number
    created_at: string
  }

  /**
   * 任务统计
   */
  interface TaskStatistics {
    total_tasks: number
    enabled_tasks: number
    disabled_tasks: number
    pending_tasks: number
    running_tasks: number
    completed_tasks: number
    failed_tasks: number
    last_24h_executions: number
    last_24h_success: number
    last_24h_failures: number
  }

  /**
   * 邮件配置
   */
  interface EmailConfig {
    to: string | string[]
    cc?: string | string[]
    bcc?: string | string[]
    subject: string
    html?: string
    text?: string
    additionalContent?: string
    attachments?: Array<{
      filename: string
      content: string | Buffer
      contentType?: string
    }>
  }

  /**
   * 图表数据
   */
  interface ChartData {
    filename: string
    base64Image: string
    chartType: string
    title?: string
    analyseName?: string
    chartConfig?: any
  }

  /**
   * 定时邮件列表查询参数
   */
  interface ScheduledEmailListQuery {
    page?: number
    pageSize?: number
    taskName?: string
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    startTime?: string
    endTime?: string
  }

  /**
   * 定时邮件列表响应
   */
  interface ScheduledEmailListResponse {
    tasks: ScheduledEmailOption[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }

  /**
   * 分页响应
   */
  interface PageResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}
