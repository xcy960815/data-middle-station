declare namespace DataSourceDto {
  type DataSourceListSortField = DataSourceDao.DataSourceListSortField
  type DataSourceListSortOrder = DataSourceDao.DataSourceListSortOrder

  type GetDataSourceListRequest = {
    page?: number
    pageSize?: number
    keyword?: string
    sortField?: DataSourceListSortField
    sortOrder?: DataSourceListSortOrder
  }

  type GetDataSourceRequest = Pick<DataSourceDao.DataSourceRecord, 'id'>

  type CreateDataSourceRequest = Pick<
    DataSourceDao.DataSourceRecord,
    'sourceName' | 'sourceDesc' | 'sourceType' | 'host' | 'port' | 'databaseName' | 'username' | 'status'
  >

  type UpdateDataSourceRequest = Pick<DataSourceDao.DataSourceRecord, 'id'> &
    Partial<
      Pick<
        DataSourceDao.DataSourceRecord,
        'sourceName' | 'sourceDesc' | 'sourceType' | 'host' | 'port' | 'databaseName' | 'username' | 'status'
      >
    >

  type DeleteDataSourceRequest = Pick<DataSourceDao.DataSourceRecord, 'id'>

  type SyncDataSourceSchemaRequest = Pick<DataSourceDao.DataSourceRecord, 'id'>

  type GetDataSourceTablesRequest = Pick<DataSourceDao.DataSourceRecord, 'id'> & {
    keyword?: string
  }

  type GetDataSourceColumnsRequest = Pick<DataSourceDao.DataSourceRecord, 'id'> & {
    tableName: string
  }
}
