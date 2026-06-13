declare namespace DatasetDao {
  type DatasetStatus = 'enabled' | 'disabled'
  type DatasetListSortField = 'datasetName' | 'createTime' | 'updateTime'
  type DatasetListSortOrder = 'asc' | 'desc'
  type DatasetFieldType = 'dimension' | 'measure'

  type DatasetRecord = {
    id: number
    datasetName: string
    datasetDesc: string
    status: DatasetStatus
    currentConfigId: number | null
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    isDeleted: number | null
  }

  type DatasetFieldConfigItem = {
    sourceColumnName: string
    fieldName: string
    displayName: string
    fieldType: DatasetFieldType
    dataType: string
    aggregationType?: AnalyzeConfigDao.MeasureAggregationType | null
    expression?: string
    visible: boolean
    sortOrder: number
  }

  type DatasetConfigRecord = {
    id: number
    datasetId: number
    versionNo: number
    querySql: string
    fieldsConfig: DatasetFieldConfigItem[]
    changeNote: string | null
    createTime: string
    createdBy: string
    updateTime: string
    isDeleted: number | null
  }

  type GetDatasetListParams = {
    page: number
    pageSize: number
    keyword?: string
    sortField: DatasetListSortField
    sortOrder: DatasetListSortOrder
    currentUserName?: string
    roleCodes?: string[]
  }

  type GetDatasetParams = Pick<DatasetRecord, 'id'> & {
    currentUserName?: string
    roleCodes?: string[]
  }

  type CreateDatasetParams = Pick<
    DatasetRecord,
    | 'datasetName'
    | 'datasetDesc'
    | 'status'
    | 'currentConfigId'
    | 'createdBy'
    | 'updatedBy'
    | 'createTime'
    | 'updateTime'
  >

  type UpdateDatasetParams = Pick<DatasetRecord, 'id' | 'updatedBy' | 'updateTime'> &
    Partial<Pick<DatasetRecord, 'datasetName' | 'datasetDesc' | 'status' | 'currentConfigId'>>

  type DeleteDatasetParams = Pick<DatasetRecord, 'id' | 'updatedBy' | 'updateTime'>

  type GetDatasetConfigParams = Partial<Pick<DatasetConfigRecord, 'id' | 'datasetId' | 'versionNo' | 'isDeleted'>>

  type CreateDatasetConfigParams = Pick<
    DatasetConfigRecord,
    'datasetId' | 'versionNo' | 'querySql' | 'fieldsConfig' | 'changeNote' | 'createdBy' | 'updateTime' | 'createTime'
  >
}
