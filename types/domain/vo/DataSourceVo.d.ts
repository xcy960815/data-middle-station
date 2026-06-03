declare namespace DataSourceVo {
  type DataSourceListItem = Pick<
    DataSourceDao.DataSourceRecord,
    | 'id'
    | 'sourceName'
    | 'sourceDesc'
    | 'sourceType'
    | 'host'
    | 'port'
    | 'databaseName'
    | 'username'
    | 'status'
    | 'createTime'
    | 'updateTime'
    | 'createdBy'
    | 'updatedBy'
  > & {
    tableCount: number
  }

  type DataSourceDetailResponse = DataSourceDao.DataSourceRecord & {
    tableCount: number
  }

  type DataSourceListResponse = {
    list: DataSourceListItem[]
    total: number
    page: number
    pageSize: number
    keyword: string
    sortField: DataSourceDao.DataSourceListSortField
    sortOrder: DataSourceDao.DataSourceListSortOrder
  }

  type DataSourceTableItem = Pick<
    DataSourceDao.DataSourceTableRecord,
    'id' | 'dataSourceId' | 'tableName' | 'tableComment' | 'tableRows' | 'lastSyncTime'
  >

  type DataSourceColumnItem = Pick<
    DataSourceDao.DataSourceColumnRecord,
    'id' | 'dataSourceId' | 'tableName' | 'columnName' | 'columnType' | 'columnComment' | 'nullable' | 'ordinalPosition'
  >

  type SyncDataSourceSchemaResponse = {
    tableCount: number
    columnCount: number
  }
}
