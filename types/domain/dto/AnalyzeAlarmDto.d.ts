declare namespace AnalyzeAlarmDto {
  /**
   * 创建报警请求参数
   */
  type CreateAlarmRequest = Omit<
    AnalyzeAlarmDao.AnalyzeAlarmRecord,
    'id' | 'createTime' | 'updateTime' | 'createdBy' | 'updatedBy' | 'lastTriggeredTime'
  >

  /**
   * 更新报警请求参数
   */
  type UpdateAlarmRequest = Partial<CreateAlarmRequest> & {
    id: number
  }

  /**
   * 获取图表报警列表请求参数
   */
  type GetAlarmsRequest = {
    analyzeId: number
  }

  /**
   * 仅传 ID 的通用请求参数
   */
  type AlarmIdRequest = {
    id: number
  }
}
