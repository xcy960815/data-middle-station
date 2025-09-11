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
    /**
     * 任务名称
     */
    taskName: string
    /**
     * 计划执行时间
     */
    scheduleTime: string
    /**
     * 邮件配置
     */
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
    /**
     * 图表数据
     */
    chartData?: {
      filename: string
      base64Image: string
      chartType: string
      title?: string
      analyseName?: string
      chartConfig?: any
    }
    /**
     * 任务状态
     */
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    /**
     * 备注
     */
    remark?: string
    /**
     * 最大重试次数
     */
    maxRetries: number
    /**
     * 重试次数
     */
    retryCount?: number
    /**
     * 错误信息
     */
    errorMessage?: string
    /**
     * 创建时间
     */
    createdAt: string
    /**
     * 更新时间
     */
    updatedAt?: string
    /**
     * 执行时间
     */
    executedAt?: string
  }

  /**
   * 任务执行日志
   */
  interface ExecutionLog {
    id: number
    /**
     * 任务ID
     */
    task_id: number
    /**
     * 执行时间
     */
    execution_time: string
    /**
     * 状态
     */
    status: 'success' | 'failed'
    /**
     * 错误信息
     */
    error_message?: string
    /**
     * 执行时间
     */
    duration?: number
    /**
     * 创建时间
     */
    created_at: string
  }

  /**
   * 任务统计
   */
  interface TaskStatistics {
    /**
     * 总任务数
     */
    total_tasks: number
    /**
     * 启用任务数
     */
    enabled_tasks: number
    /**
     * 禁用任务数
     */
    disabled_tasks: number
    /**
     * 待执行任务数
     */
    pending_tasks: number
    /**
     * 运行中任务数
     */
    running_tasks: number
    /**
     * 完成任务数
     */
    completed_tasks: number
    /**
     * 失败任务数
     */
    failed_tasks: number
    /**
     * 最近24小时执行数
     */
    last_24h_executions: number
    /**
     * 最近24小时成功数
     */
    last_24h_success: number
    /**
     * 最近24小时失败数
     */
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
    taskName?: string
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  }

  /**
   * 定时邮件列表响应
   */
  type ScheduledEmailListResponse = ScheduledEmailOption[]
}
