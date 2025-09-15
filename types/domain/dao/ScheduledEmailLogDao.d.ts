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
     * 执行耗时(毫秒)
     */
    executionDuration?: number
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
}
