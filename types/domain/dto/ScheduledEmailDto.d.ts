/**
 * 定时邮件任务传输对象
 */
declare namespace ScheduledEmailDto {
  /**
   * 执行日志 (Snake Case for frontend/external use)
   */
  interface ExecutionLog {
    id: number
    task_id: number
    execution_time: string
    status: 'success' | 'failed'
    error_message?: string
    email_message_id?: string
    sender_email?: string
    sender_name?: string
    recipient_to?: string[]
    recipient_cc?: string[]
    recipient_bcc?: string[]
    email_subject?: string
    attachment_count?: number
    attachment_names?: string[]
    email_channel?: string
    provider?: string
    provider_response?: string
    accepted_recipients?: string[]
    rejected_recipients?: string[]
    retry_count?: number
    duration?: number
    execution_timezone?: string
    smtp_host?: string
    smtp_port?: number
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

  type EmailConfig = ScheduledEmailDao.EmailConfig
  type AnalyzeOptions = ScheduledEmailDao.AnalyzeOptions

  type ScheduledEmailOptions = ScheduledEmailDao.ScheduledEmailOptions
  type ScheduledEmailQueryOptions = ScheduledEmailDao.ScheduledEmailQueryOptions

  /**
   * 获取定时邮件任务请求参数
   */
  type GetScheduledEmailOptions = Partial<ScheduledEmailOptions> & {
    id: number
  }

  /**
   * 更新定时邮件任务请求参数
   */
  type UpdateScheduledEmailOptions = Omit<
    ScheduledEmailOptions,
    'createdTime' | 'createdBy' | 'updatedTime' | 'updatedBy'
  >

  /**
   * 删除定时邮件任务请求参数
   */
  type DeleteScheduledEmailOptions = Pick<ScheduledEmailOptions, 'id' | 'updatedBy' | 'updatedTime'>

  /**
   * 创建定时邮件任务请求参数
   */
  type CreateScheduledEmailOptions = Omit<
    ScheduledEmailOptions,
    'id' | 'createdTime' | 'createdBy' | 'updatedTime' | 'updatedBy'
  >

  /**
   * 定时邮件列表查询参数
   */
  type ScheduledEmailListQuery = ScheduledEmailDao.ScheduledEmailListOptions
}
