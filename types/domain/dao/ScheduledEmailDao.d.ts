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
  type AnalyzeOptions = {
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
    analyzeName: string
    /**
     * 分析id
     */
    analyzeId: number
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
   * @desc 定时邮件任务查询条件
   */
  type ScheduledEmailQueryOptions = {
    /**
     * 任务ID
     */
    id?: number
    /**
     * 任务名称
     */
    taskName?: string
    /**
     * 任务状态
     */
    status?: Status
    /**
     * 任务类型
     */
    taskType?: TaskType
    /**
     * 是否启用
     */
    isActive?: boolean
    /**
     * 创建人
     */
    createdBy?: string
    /**
     * 更新人
     */
    updatedBy?: string
    /**
     * 最小时段重试次数
     */
    minRetryCount?: number
    /**
     * 最大时段重试次数
     */
    maxRetryCount?: number
    /**
     * 最小最大重试阈值
     */
    maxRetries?: number
    /**
     * 标签/备注关键词
     */
    remarkKeyword?: string
    /**
     * 计划执行时间范围开始
     */
    scheduleTimeStart?: string
    /**
     * 计划执行时间范围结束
     */
    scheduleTimeEnd?: string
    /**
     * 下次执行时间范围开始
     */
    nextExecutionTimeStart?: string
    /**
     * 下次执行时间范围结束
     */
    nextExecutionTimeEnd?: string
  }

  type GetScheduledEmailOptions = Partial<ScheduledEmailOptions> & {
    id: number
  }

  /**
   * @desc 创建任务参数
   */
  type CreateScheduledEmailOptions = Omit<ScheduledEmailOptions, 'id'>

  /**
   * @desc 更新任务参数
   */
  type UpdateScheduledEmailOptions = Omit<ScheduledEmailOptions, 'createdTime' | 'createdBy'>

  /**
   * @desc 删除任务参数
   */
  type DeleteScheduledEmailOptions = Pick<ScheduledEmailOptions, 'id' | 'updatedBy' | 'updatedTime'>

  /**
   * @desc 任务列表查询参数
   */
  type ScheduledEmailListOptions = ScheduledEmailQueryOptions & {
    keyword?: string
    limit?: number
    offset?: number
    orderBy?: 'created_time' | 'schedule_time' | 'updated_time'
    orderDirection?: 'asc' | 'desc'
  }
}
