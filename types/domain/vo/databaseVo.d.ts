/**
 * 返还给前端的数据
 */
declare namespace DatabaseVo {
  /**
   * 表信息
   */
  type TableItem = DatabaseDao.TableRecord

  /**
   * 表列信息
   */
  type TableColumnItem = DatabaseDao.TableColumnRecord & {
    displayName: string
    datasetFieldName?: string
    datasetFieldType?: DatasetDao.DatasetFieldType
    datasetAggregationType?: import('@/shared/domainTypes').MeasureAggregationType
  }
}
