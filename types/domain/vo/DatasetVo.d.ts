declare namespace DatasetVo {
  type DatasetListItem = Pick<
    DatasetDao.DatasetRecord,
    | 'id'
    | 'datasetName'
    | 'datasetDesc'
    | 'dataSourceId'
    | 'baseTable'
    | 'status'
    | 'createTime'
    | 'updateTime'
    | 'createdBy'
    | 'updatedBy'
  > & {
    dataSourceName: string
    fieldCount: number
  }

  type DatasetDetailResponse = DatasetDao.DatasetRecord & {
    dataSource: DataSourceVo.DataSourceDetailResponse | null
    fieldsConfig: DatasetDao.DatasetFieldConfigItem[]
  }

  type DatasetListResponse = {
    list: DatasetListItem[]
    total: number
    page: number
    pageSize: number
    keyword: string
    sortField: DatasetDao.DatasetListSortField
    sortOrder: DatasetDao.DatasetListSortOrder
  }

  type DatasetPreviewResponse = {
    columns: DatasetDao.DatasetFieldConfigItem[]
    rows: AnalyzeDataVo.AnalyzeData[]
  }
}
