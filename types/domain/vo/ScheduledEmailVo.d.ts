/**
 * @desc 定时邮件任务视图对象
 */
declare namespace ScheduledEmailVo {
  type ScheduledEmailTaskEmailConfig = Pick<ScheduledEmailDao.EmailConfig, 'subject' | 'additionalContent'> & {
    to: string
  }

  /**
   * @desc 定时邮件任务响应
   */
  type ScheduledEmailTaskResponse = Omit<ScheduledEmailDao.ScheduledEmailRecord, 'emailConfig'> & {
    emailConfig: ScheduledEmailTaskEmailConfig
  }

  /**
   * @desc 定时邮件任务列表响应
   */
  type ScheduledEmailTaskListResponse = ScheduledEmailTaskResponse[]
}
