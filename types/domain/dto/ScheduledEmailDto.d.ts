/**
 * @desc 定时邮件任务数据传输层类型定义
 */
declare namespace ScheduledEmailDto {
  /**
   * @desc 任务类型
   */
  type TaskType = 'scheduled' | 'recurring'

  /**
   * @desc 邮件配置
   */
  interface EmailConfig {
    to: string
    subject: string
    additionalContent?: string
  }

  /**
   * @desc 分析选项
   */
  interface AnalyzeOptions {
    filename: string
    chartType: string
    analyzeName: string
    analyzeId: number
  }

  /**
   * @desc 任务状态
   */
  type Status = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

  /**
   * @desc 创建定时邮件任务请求
   */
  interface CreateScheduledEmailRequest {
    /**
     * 任务ID
     */
    id: number
    /**
     * 任务名称
     */
    taskName: string
    /**
     * 计划执行时间（定时任务使用）
     */
    scheduleTime?: string | null
    /**
     * 任务类型
     */
    taskType: TaskType
    /**
     * 重复的星期几（重复任务使用）
     */
    recurringDays?: number[] | null
    /**
     * 重复任务的执行时间（重复任务使用）
     */
    recurringTime?: string | null
    /**
     * 是否启用任务
     */
    isActive: boolean
    /**
     * 下次执行时间（重复任务使用）
     */
    nextExecutionTime?: string | null
    /**
     * 邮件配置
     */
    emailConfig: EmailConfig
    /**
     * 图表数据
     */
    analyzeOptions: AnalyzeOptions
    /**
     * 任务状态
     */
    status: Status
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
    errorMessage?: string | null
    /**
     * 创建时间
     */
    createdTime: string
    /**
     * 更新时间
     */
    updatedTime: string
    /**
     * 执行时间
     */
    executedTime?: string | null
    /**
     * 创建人
     */
    createdBy: string
    /**
     * 更新人
     */
    updatedBy: string
  }

  /**
   * @desc 创建定时邮件任务请求
   */
  type CreateScheduledEmailOptions = Omit<
    CreateScheduledEmailRequest,
    | 'id'
    | 'nextExecutionTime'
    | 'createdTime'
    | 'updatedTime'
    | 'executedTime'
    | 'errorMessage'
    | 'createdBy'
    | 'updatedBy'
    | 'status'
    | 'isActive'
    | 'maxRetries'
    | 'retryCount'
  >

  /**
   * 更新定时邮件任务请求
   */
  type UpdateScheduledEmailOptions = Omit<
    CreateScheduledEmailRequest,
    | 'id'
    | 'nextExecutionTime'
    | 'createdTime'
    | 'updatedTime'
    | 'executedTime'
    | 'errorMessage'
    | 'createdBy'
    | 'updatedBy'
    | 'status'
    | 'isActive'
    | 'maxRetries'
    | 'retryCount'
  > & {
    id: number
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
   * 定时邮件列表查询参数
   */
  interface ScheduledEmailListRequest {
    id?: number
    taskName?: string
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  }
}
