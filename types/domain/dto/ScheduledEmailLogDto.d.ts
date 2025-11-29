/**
 * @desc 定时邮件日志数据传输对象类型定义
 */
declare namespace ScheduledEmailLogDto {
  /**
   * @desc 执行日志
   */
  type ExecutionLog = ScheduledEmailLogDao.ScheduledEmailLogOptions

  /**
   * @desc 创建日志请求
   */
  type CreateLogOptions = ScheduledEmailLogDao.CreateScheduledEmailLogOptions

  /**
   * @desc 日志列表查询参数
   */
  type LogListQuery = ScheduledEmailLogDao.LogListQuery

  /**
   * @desc 日志统计信息
   */
  type LogStatistics = ScheduledEmailLogDao.LogStatistics

  /**
   * @desc 日志列表响应
   */
  interface LogListResponse {
    logs: ExecutionLog[]
    total: number
    pagination: {
      limit: number
      offset: number
      hasMore: boolean
    }
  }

  type ScheduledEmailLogOptions = ScheduledEmailLogDao.ScheduledEmailLogOptions

  /**
   * 获取日志请求参数
   */
  type GetScheduledEmailLogOptions = Partial<ScheduledEmailLogOptions> & {
    id: number
  }

  /**
   * 更新日志请求参数
   */
  type UpdateScheduledEmailLogOptions = Omit<ScheduledEmailLogOptions, 'createdTime' | 'createdBy'>

  /**
   * 删除日志请求参数
   */
  type DeleteScheduledEmailLogOptions = Pick<ScheduledEmailLogOptions, 'id'>

  /**
   * 创建日志请求参数
   */
  type CreateScheduledEmailLogOptions = Omit<ScheduledEmailLogOptions, 'id' | 'createdTime' | 'createdBy'>

  /**
   * @desc 执行日志单条查询请求
   */
  type GetExecutionLogOptions = ScheduledEmailLogDao.GetScheduledEmailLogQuery

  /**
   * @desc 执行日志删除请求
   */
  type DeleteExecutionLogOptions = ScheduledEmailLogDao.DeleteScheduledEmailLogOptions

  /**
   * @desc 成功率统计查询请求
   */
  type TaskSuccessRateQuery = ScheduledEmailLogDao.TaskSuccessRateQuery
}
