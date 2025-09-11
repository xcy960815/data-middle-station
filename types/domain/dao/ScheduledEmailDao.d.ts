/**
 * @desc 定时邮件任务数据访问层类型定义
 */
declare namespace ScheduledEmailDao {
  /**
   * @desc 定时邮件任务选项
   */
  type ScheduledEmailOptions = {
    /**
     * 任务ID
     */
    id: number
    /**
     * 任务ID
     */
    taskName: string
    /**
     * 调度时间
     */
    scheduleTime: string
    /**
     * 邮件配置
     */
    emailConfig: string
    /**
     * 图表数据
     */
    chartData: string
    /**
     * 任务状态
     */
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    /**
     * 备注
     */
    remark?: string
    /**
     * 创建时间
     */
    createdAt: string
    /**
     * 更新时间
     */
    updatedAt: string
    /**
     * 执行时间
     */
    executedAt?: string
    /**
     * 错误信息
     */
    errorMessage?: string
    /**
     * 重试次数
     */
    retryCount: number
    /**
     * 最大重试次数
     */
    maxRetries: number
  }

  /**
   * @desc 执行日志选项
   */
  type ExecutionLogOption = {
    /**
     * 日志ID
     */
    id: number
    /** 任务ID */
    taskId: number
    /**
     * 执行时间
     */
    executionTime: string
    /** 执行状态 */
    status: 'success' | 'failed'
    /**
     * 消息
     */
    message?: string
    /**
     * 错误详情
     */
    errorDetails?: string
    /**
     * 邮件消息ID
     */
    emailMessageId?: string
    /**
     * 执行耗时(毫秒)
     */
    executionDuration?: number
    /**
     * 创建时间
     */
    createdAt: string
  }

  /**
   * @desc 更新任务参数
   */
  type UpdateTaskParams = {
    /**
     * 任务ID
     */
    id: number
    /**
     * 任务名称
     */
    taskName?: string
    /**
     * 调度时间
     */
    scheduleTime?: string
    /** 邮件配置 */
    emailConfig?: string
    /**
     * 图表数据
     */
    chartData?: string
    /**
     * 任务状态
     */
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    /**
     * 备注
     */
    remark?: string
    /**
     * 错误信息
     */
    errorMessage?: string
    /**
     * 重试次数
     */
    retryCount?: number
    /**
     * 最大重试次数
     */
    maxRetries?: number
  }

  /**
   * @desc 创建日志参数
   */
  type CreateLogParams = {
    /**
     * 任务ID
     */
    taskId: number
    /**
     * 执行时间
     */
    executionTime: string
    /**
     * 执行状态
     */
    status: 'success' | 'failed'
    /**
     * 消息
     */
    message?: string
    /**
     * 错误详情
     */
    errorDetails?: string
    /**
     * 邮件消息ID
     */
    emailMessageId?: string
    /**
     * 执行耗时(毫秒)
     */
    executionDuration?: number
  }
}
