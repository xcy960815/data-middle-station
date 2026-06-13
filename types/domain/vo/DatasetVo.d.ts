declare namespace DatasetVo {
  type DatasetListItem = Pick<
    DatasetDao.DatasetRecord,
    'id' | 'datasetName' | 'datasetDesc' | 'status' | 'createTime' | 'updateTime' | 'createdBy' | 'updatedBy'
  > & {
    querySql: string
    fieldCount: number
    datasetPermission?: PermissionVo.ResourcePermissionType
  }

  type DatasetDetailResponse = DatasetDao.DatasetRecord & {
    querySql: string
    fieldsConfig: DatasetDao.DatasetFieldConfigItem[]
    datasetPermission?: PermissionVo.ResourcePermissionType
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

  type DatasetSchemaColumn = {
    columnName: string
    columnType: string
    columnComment: string
  }

  type DatasetSchemaTable = {
    tableName: string
    tableComment: string
    columns: DatasetSchemaColumn[]
  }

  type DatasetSchemaResponse = {
    databaseName: string
    tables: DatasetSchemaTable[]
  }
}
