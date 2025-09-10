declare namespace ScheduledEmailDao {
  /**
   * 数据库字段映射接口
   */
  interface ScheduledEmailOption {
    id: number // 任务ID
    task_name: string // 任务名称
    schedule_time: string // 计划执行时间
    email_config: string // 邮件配置(JSON字符串)
    chart_data: string // 图表数据(JSON字符串)
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' // 任务状态
    remark?: string // 备注说明
    created_at: string // 创建时间
    updated_at: string // 更新时间
    executed_at?: string // 执行时间
    error_message?: string // 错误信息
    retry_count: number // 重试次数
    max_retries: number // 最大重试次数
  }

  /**
   * 创建任务参数
   */
  interface CreateTaskParams {
    task_name: string
    schedule_time: string
    email_config: string // JSON字符串
    chart_data: string // JSON字符串
    remark?: string
    max_retries?: number
  }

  /**
   * 更新任务参数
   */
  interface UpdateTaskParams {
    id: number
    task_name?: string
    schedule_time?: string
    email_config?: string // JSON字符串
    chart_data?: string // JSON字符串
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    remark?: string
    executed_at?: string
    error_message?: string
    retry_count?: number
    max_retries?: number
  }

  /**
   * 查询参数
   */
  interface QueryParams {
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    task_name?: string
    start_time?: string
    end_time?: string
    limit?: number
    offset?: number
  }

  /**
   * 执行日志数据库字段
   */
  interface ExecutionLogOption {
    id: number
    task_id: number
    execution_time: string
    status: 'success' | 'failed'
    message?: string
    error_details?: string
    email_message_id?: string
    execution_duration?: number
    created_at: string
  }

  /**
   * 创建执行日志参数
   */
  interface CreateLogParams {
    task_id: number
    execution_time: string
    status: 'success' | 'failed'
    message?: string
    error_details?: string
    email_message_id?: string
    execution_duration?: number
  }
}
