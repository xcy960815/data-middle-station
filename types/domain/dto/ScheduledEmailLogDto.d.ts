/**
 * @desc 定时邮件日志数据传输对象类型定义
 */
declare namespace ScheduledEmailLogDto {
  /**
   * @desc 创建日志请求
   */
  type CreateExecutionLogRequest = Omit<
    ScheduledEmailLogDao.ScheduledEmailLogRecord,
    'id' | 'createdTime' | 'createdBy'
  >

  /**
   * @desc 创建日志负载
   */
  type CreateExecutionLogPayload = CreateExecutionLogRequest

  /**
   * @desc 日志列表查询参数
   */
  type LogListRequest = ScheduledEmailLogDao.LogListQuery

  /**
   * @desc 执行日志单条查询请求
   */
  type GetExecutionLogRequest = ScheduledEmailLogDao.GetScheduledEmailLogQuery

  /**
   * @desc 执行日志删除请求
   */
  type DeleteExecutionLogRequest = ScheduledEmailLogDao.DeleteScheduledEmailLogParams

  /**
   * @desc 成功率统计查询请求
   */
  type TaskSuccessRateRequest = ScheduledEmailLogDao.TaskSuccessRateQuery
}
