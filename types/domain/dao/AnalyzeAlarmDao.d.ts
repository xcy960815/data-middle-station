/**
 * 分析模块报警配置与日志
 */
declare namespace AnalyzeAlarmDao {
  /**
   * 通知配置
   */
  type NotificationConfig = {
    emails?: string[]
    webhookUrl?: string
  }

  /**
   * 触发条件
   */
  type AlarmCondition = {
    measureId: string
    operator: '>' | '<' | '=' | '>=' | '<=' | '!='
    threshold: number
  }

  /**
   * 报警策略
   */
  type AlarmStrategy = 'always' | 'once_per_day' | 'only_state_change'

  /**
   * 报警规则记录
   */
  type AnalyzeAlarmRecord = {
    id: number
    analyzeId: number
    alarmName: string
    isActive: number
    cronExpression: string
    conditions: AlarmCondition[]
    notificationConfig: NotificationConfig
    alarmStrategy: AlarmStrategy
    lastTriggeredTime?: string | null
    createdBy?: string
    updatedBy?: string
    createTime?: string
    updateTime?: string
  }

  /**
   * 获取报警请求参数
   */
  type GetAnalyzeAlarmParams = Partial<AnalyzeAlarmRecord>

  /**
   * 创建报警请求参数
   */
  type CreateAnalyzeAlarmParams = Omit<AnalyzeAlarmRecord, 'id' | 'createTime' | 'updateTime'>

  /**
   * 更新报警请求参数
   */
  type UpdateAnalyzeAlarmParams = Partial<AnalyzeAlarmRecord> & {
    id: number
  }

  /**
   * 报警日志记录
   */
  type AnalyzeAlarmLogRecord = {
    id: number
    alarmId: number
    executeTime: string
    isTriggered: number
    triggerDetail?: any
    notifyStatus?: string
    errorMessage?: string
  }

  type CreateAnalyzeAlarmLogParams = Omit<AnalyzeAlarmLogRecord, 'id'> & { executeTime?: string }
}
