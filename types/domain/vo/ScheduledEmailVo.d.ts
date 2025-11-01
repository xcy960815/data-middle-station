declare namespace ScheduledEmailVo {
  type Status = ScheduledEmailDao.Status
  type EmailConfig = ScheduledEmailDao.EmailConfig
  type AnalyseOptions = ScheduledEmailDao.AnalyseOptions
  type TaskType = ScheduledEmailDao.TaskType

  /**
   * @desc 定时邮件任务响应
   */
  interface ScheduledEmailResponse {
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
}
