/**
 * @desc 定时邮件日志视图对象类型定义（用于返回给前端的数据）
 */
declare namespace ScheduledEmailLogVo {
  /**
   * @desc 执行日志选项
   */
  interface ScheduledEmailLogOptions {
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
    recipientTo?: string[]
    /**
     * 抄送
     */
    recipientCc?: string[]
    /**
     * 密送
     */
    recipientBcc?: string[]
    /**
     * 回复地址
     */
    replyTo?: string
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
    attachmentNames?: string[]
    /**
     * 邮件通道
     */
    emailChannel?: string
    /**
     * 邮件服务提供方
     */
    provider?: string
    /**
     * 服务响应
     */
    providerResponse?: string
    /**
     * 接收成功的收件人
     */
    acceptedRecipients?: string[]
    /**
     * 拒收的收件人
     */
    rejectedRecipients?: string[]
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
    executionTimezone?: string
    /**
     * 原始请求
     */
    rawRequestPayload?: Record<string, any>
    /**
     * 原始响应
     */
    rawResponsePayload?: Record<string, any>
    /**
     * SMTP主机
     */
    smtpHost?: string
    /**
     * SMTP端口
     */
    smtpPort?: number
    /**
     * 创建时间
     */
    createdTime: string
    /**
     * 创建时区
     */
    createdTimezone?: string
  }

  /**
   * @desc 日志统计信息
   */
  interface LogStatistics {
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
   * @desc 日志列表选项
   */
  interface LogListOptions {
    /**
     * 日志列表
     */
    logs: ScheduledEmailLogOptions[]
    /**
     * 总数
     */
    total: number
    /**
     * 分页信息
     */
    pagination: {
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}
