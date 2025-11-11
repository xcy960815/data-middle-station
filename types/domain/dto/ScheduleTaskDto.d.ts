declare namespace ScheduleTaskDto {
  /**
   * 邮件配置
   */
  interface EmailConfig {
    to: string // 收件人邮箱地址（多个用逗号分隔）
    subject: string // 邮件主题
    additionalContent?: string // 额外说明内容
  }

  /**
   * 图表数据
   */
  interface ChartData {
    chartId: string // 图表ID
    title: string // 图表标题
    base64Image: string // 图表base64图片
    filename: string // 文件名
    analyzeName?: string // 分析名称
  }

  /**
   * 创建定时任务请求
   */
  interface ScheduleTaskOptions {
    /**
     * 任务名称
     */
    taskName: string
    /**
     * 任务类型
     */
    taskType: 'email' // 任务类型
    /**
     * 计划执行时间
     */
    scheduleTime: string // 计划执行时间 (YYYY-MM-DD HH:mm:ss)
    /**
     * 邮件配置
     */
    emailConfig: EmailConfig // 邮件配置
    /**
     * 图表数据
     */
    chartData: ChartData // 图表数据
    /**
     * 备注说明
     */
    remark?: string // 备注说明
  }

  /**
   * 定时任务响应
   */
  interface ScheduleTaskResponse {
    id: number // 任务ID
    taskName: string // 任务名称
    taskType: string // 任务类型
    scheduleTime: string // 计划执行时间
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' // 任务状态
    emailConfig: EmailConfig // 邮件配置
    chartData: ChartData // 图表数据
    remark?: string // 备注说明
    createdAt: string // 创建时间
    updatedAt: string // 更新时间
    executedAt?: string // 执行时间
    errorMessage?: string // 错误信息
  }

  /**
   * 定时任务列表响应
   */
  interface ScheduleTaskListResponse {
    tasks: ScheduleTaskResponse[]
    total: number
    page: number
    pageSize: number
  }

  /**
   * 更新定时任务请求
   */
  interface UpdateScheduleTaskRequest {
    taskName?: string // 任务名称
    scheduleTime?: string // 计划执行时间
    emailConfig?: Partial<EmailConfig> // 邮件配置
    remark?: string // 备注说明
    status?: 'pending' | 'cancelled' // 可更新的状态
  }
}
