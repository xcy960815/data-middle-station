/**
 * @desc 定时邮件任务数据访问层类型定义
 */
declare namespace ScheduledEmailDao {
  /**
   * @desc 任务状态
   */
  type Status = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  /**
   * @desc 邮件配置
   */
  type EmailConfig = {
    /**
     * 收件人
     */
    to: string | string[]
    /**
     * 抄送
     */
    cc?: string | string[]
    /**
     * 密送
     */
    bcc?: string | string[]
    /**
     * 邮件主题
     */
    subject: string
    /**
     * HTML内容
     */
    html?: string
    /**
     * 文本内容
     */
    text?: string
    /**
     * 附加内容
     */
    additionalContent?: string
    /**
     * 附件
     */
    attachments?: Array<{
      /**
       * 附件名称
       */
      filename: string
      /**
       * 附件内容
       */
      content: string | Buffer
      /**
       * 附件内容类型
       */
      contentType?: string
    }>
  }
  /**
   * @desc 分析选项
   */
  type AnalyseOptions = {
    /**
     * 附件名称
     */
    filename: string
    /**
     * 图表类型
     */
    chartType: string
    /**
     * 分析名称
     */
    analyseName: string
    /**
     * 分析id
     */
    analyseId: number
  }
  /**
   * @desc 任务类型 scheduled 定时任务 recurring 重复任务
   */
  type TaskType = 'scheduled' | 'recurring'

  /**
   * @desc 定时邮件任务选项
   */
  type ScheduledEmailOptions = {
    /**
     * 任务ID
     */
    id: number
    /**
     * 任务名称
     */
    taskName: string
    /**
     * 调度时间（定时任务使用）
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
    analyseOptions: AnalyseOptions
    /**
     * 任务状态
     */
    status: Status
    /**
     * 备注
     */
    remark?: string
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
     * 错误信息
     */
    errorMessage?: string | null
    /**
     * 重试次数
     */
    retryCount: number
    /**
     * 最大重试次数
     */
    maxRetries: number
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
   * @desc 创建任务参数
   */
  type CreateScheduledEmailOptions = Omit<ScheduledEmailOptions, 'id'>

  /**
   * @desc 更新任务参数
   */
  type UpdateScheduledEmailOptions = Omit<ScheduledEmailOptions, 'id'> & {
    /**
     * 任务ID
     */
    id: number
  }
}
