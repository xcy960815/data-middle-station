declare namespace DatasetDto {
  type DatasetListSortField = DatasetDao.DatasetListSortField
  type DatasetListSortOrder = DatasetDao.DatasetListSortOrder

  type GetDatasetListRequest = {
    page?: number
    pageSize?: number
    keyword?: string
    sortField?: DatasetListSortField
    sortOrder?: DatasetListSortOrder
  }

  type GetDatasetRequest = Pick<DatasetDao.DatasetRecord, 'id'>

  type CreateDatasetRequest = Pick<DatasetDao.DatasetRecord, 'datasetName' | 'datasetDesc' | 'status'> & {
    querySql?: string
    fieldsConfig?: DatasetDao.DatasetFieldConfigItem[]
  }

  type UpdateDatasetRequest = Pick<DatasetDao.DatasetRecord, 'id'> &
    Partial<Pick<DatasetDao.DatasetRecord, 'datasetName' | 'datasetDesc' | 'status'>> & {
      querySql?: string
      fieldsConfig?: DatasetDao.DatasetFieldConfigItem[]
      changeNote?: string
    }

  type PreviewDatasetSqlRequest = {
    querySql: string
    limit?: number
  }

  type DeleteDatasetRequest = Pick<DatasetDao.DatasetRecord, 'id'>

  type PreviewDatasetRequest = Pick<DatasetDao.DatasetRecord, 'id'> & {
    limit?: number
  }
}
