/**
 * @desc 定时邮件日志视图对象类型定义（用于返回给前端的数据）
 */
declare namespace ScheduledEmailLogVo {
  /**
   * @desc 执行日志选项
   */
  type ScheduledEmailLogOptions = ScheduledEmailLogDao.ScheduledEmailLogOptions

  /**
   * @desc 获取日志响应
   */
  type GetScheduledEmailLogOptions = ScheduledEmailLogOptions

  /**
   * @desc 日志统计信息
   */
  type LogStatistics = ScheduledEmailLogDao.LogStatistics

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
