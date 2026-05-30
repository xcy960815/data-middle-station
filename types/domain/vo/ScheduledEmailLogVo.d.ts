/**
 * @desc 定时邮件日志视图对象类型定义（用于返回给前端的数据）
 */
declare namespace ScheduledEmailLogVo {
  /**
   * @desc 执行日志项
   */
  type ExecutionLogItem = ScheduledEmailLogDao.ScheduledEmailLogRecord

  /**
   * @desc 获取日志响应
   */
  type ExecutionLogResponse = ExecutionLogItem

  /**
   * @desc 日志统计信息
   */
  type LogStatistics = ScheduledEmailLogDao.LogStatistics

  /**
   * @desc 日志列表响应
   */
  interface LogListResponse {
    /**
     * 日志列表
     */
    logs: ExecutionLogItem[]
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
