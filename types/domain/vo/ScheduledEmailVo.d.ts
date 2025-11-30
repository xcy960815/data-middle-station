/**
 * @desc 定时邮件任务视图对象
 */
declare namespace ScheduledEmailVo {
  type ScheduledEmailOptions = ScheduledEmailDao.ScheduledEmailOptions

  /**
   * @desc 获取定时邮件任务响应
   */
  type GetScheduledEmailOptions = ScheduledEmailOptions

  /**
   * @desc 创建定时邮件任务响应
   */
  type CreateScheduledEmailOptions = ScheduledEmailOptions

  /**
   * @desc 更新定时邮件任务响应
   */
  type UpdateScheduledEmailOptions = boolean

  /**
   * @desc 删除定时邮件任务响应
   */
  type DeleteScheduledEmailOptions = boolean
}
