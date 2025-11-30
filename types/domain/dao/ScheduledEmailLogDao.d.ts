/**
 * @desc 定时邮件日志数据访问层类型定义
 */
declare namespace ScheduledEmailLogDao {
  type Status = 'success' | 'failed'
  /**
   * @desc 执行日志选项
   */
  type ScheduledEmailLogOptions = {
    /**
     * 日志ID
     */
    id: number
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
    status: Status
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
     * 发件人邮箱
     */
    senderEmail?: string
    /**
     * 发件人名称
     */
    senderName?: string
    /**
     * 收件人(To)
     */
    recipientTo?: string | string[]
    /**
     * 抄送
     */
    recipientCc?: string | string[] | null
    /**
     * 密送
     */
    recipientBcc?: string | string[] | null
    /**
     * 回复地址
     */
    replyTo?: string | null
    /**
     * 邮件主题
     */
    emailSubject?: string
    /**
     * 附件数量
     */
    attachmentCount?: number
    /**
     * 附件名称
     */
    attachmentNames?: string | string[] | null
    /**
     * 邮件通道
     */
    emailChannel?: string
    /**
     * 邮件服务提供方
     */
    provider?: string | null
    /**
     * 服务响应信息
     */
    providerResponse?: string | null
    /**
     * 接收成功的收件人
     */
    acceptedRecipients?: string | string[] | null
    /**
     * 拒收的收件人
     */
    rejectedRecipients?: string | string[] | null
    /**
     * 重试次数
     */
    retryCount?: number
    /**
     * 执行耗时(毫秒)
     */
    executionDuration?: number
    /**
     * 执行时区
     */
    executionTimezone?: string | null
    /**
     * 原始请求负载
     */
    rawRequestPayload?: string | Record<string, any> | null
    /**
     * 原始响应负载
     */
    rawResponsePayload?: string | Record<string, any> | null
    /**
     * SMTP主机
     */
    smtpHost?: string | null
    /**
     * SMTP端口
     */
    smtpPort?: number | null
    /**
     * 创建时间
     */
    createdTime: string

    /**
     * 创建人
     */
    createdBy: string
  }

  /**
   * @desc 创建日志参数
   */
  type CreateScheduledEmailLogOptions = Omit<ScheduledEmailLogOptions, 'id'>

  /**
   * @desc 日志查询参数
   */
  type LogListQuery = {
    /**
     * 任务ID
     */
    taskId?: number
    /**
     * 执行状态
     */
    status?: Status
    /**
     * 开始时间
     */
    startTime?: string
    /**
     * 结束时间
     */
    endTime?: string
    /**
     * 分页大小
     */
    limit?: number
    /**
     * 偏移量
     */
    offset?: number
  }

  /**
   * @desc 日志统计信息
   */
  type LogStatistics = {
    /**
     * 总日志数
     */
    totalLogs: number
    /**
     * 成功执行数
     */
    successCount: number
    /**
     * 失败执行数
     */
    failedCount: number
    /**
     * 今日执行数
     */
    todayCount: number
    /**
     * 本周执行数
     */
    thisWeekCount: number
    /**
     * 本月执行数
     */
    thisMonthCount: number
    /**
     * 平均执行时长(毫秒)
     */
    avgDuration: number
  }

  /**
   * @desc 获取日志请求参数
   */
  type GetScheduledEmailLogOptions = Partial<ScheduledEmailLogOptions> & {
    id: number
  }

  /**
   * @desc 执行日志单条查询参数
   */
  type GetScheduledEmailLogQuery = {
    /**
     * 日志ID
     */
    id?: number
    /**
     * 任务ID
     */
    taskId?: number
    /**
     * 执行状态
     */
    status?: Status
    /**
     * 邮件消息ID
     */
    emailMessageId?: string
    /**
     * 发件人邮箱
     */
    senderEmail?: string
    /**
     * 发件人名称
     */
    senderName?: string
    /**
     * 收件人(To)
     */
    recipientTo?: string
    /**
     * 抄送
     */
    recipientCc?: string
    /**
     * 密送
     */
    recipientBcc?: string
    /**
     * 邮件主题
     */
    emailSubject?: string
    /**
     * 邮件通道
     */
    emailChannel?: string
    /**
     * 服务提供方
     */
    provider?: string
    /**
     * 创建人
     */
    createdBy?: string
  }

  /**
   * @desc 执行日志删除参数
   */
  type DeleteScheduledEmailLogOptions = GetScheduledEmailLogQuery

  /**
   * @desc 成功率统计查询参数
   */
  type TaskSuccessRateQuery = GetScheduledEmailLogQuery & {
    /**
     * 统计天数，默认30天
     */
    days?: number
    /**
     * 开始时间
     */
    startTime?: string
    /**
     * 结束时间
     */
    endTime?: string
  }
}
