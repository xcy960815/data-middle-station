declare namespace DatasetVo {
  type DatasetListItem = Pick<
    DatasetDao.DatasetRecord,
    'id' | 'datasetName' | 'datasetDesc' | 'status' | 'createTime' | 'updateTime' | 'createdBy' | 'updatedBy'
  > & {
    querySql: string
    fieldCount: number
  }

  type DatasetDetailResponse = DatasetDao.DatasetRecord & {
    querySql: string
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
    elapsedMs?: number
  }
}
