declare namespace DataSourceDao {
  type DataSourceType = 'mysql'
  type DataSourceStatus = 'enabled' | 'disabled'
  type DataSourceListSortField = 'sourceName' | 'createTime' | 'updateTime'
  type DataSourceListSortOrder = 'asc' | 'desc'

  type DataSourceRecord = {
    id: number
    sourceName: string
    sourceDesc: string
    sourceType: DataSourceType
    host: string
    port: number
    databaseName: string
    username: string
    status: DataSourceStatus
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    isDeleted: number | null
  }

  type DataSourceTableRecord = {
    id: number
    dataSourceId: number
    tableName: string
    tableComment: string
    tableRows: number
    lastSyncTime: string
    createTime: string
    updateTime: string
    isDeleted: number | null
  }

  type DataSourceColumnRecord = {
    id: number
    dataSourceId: number
    tableName: string
    columnName: string
    columnType: string
    columnComment: string
    nullable: string
    ordinalPosition: number
    createTime: string
    updateTime: string
    isDeleted: number | null
  }

  type GetDataSourceListParams = {
    page: number
    pageSize: number
    keyword?: string
    sortField: DataSourceListSortField
    sortOrder: DataSourceListSortOrder
  }

  type GetDataSourceParams = Pick<DataSourceRecord, 'id'>

  type CreateDataSourceParams = Pick<
    DataSourceRecord,
    | 'sourceName'
    | 'sourceDesc'
    | 'sourceType'
    | 'host'
    | 'port'
    | 'databaseName'
    | 'username'
    | 'status'
    | 'createdBy'
    | 'updatedBy'
    | 'createTime'
    | 'updateTime'
  >

  type UpdateDataSourceParams = Pick<DataSourceRecord, 'id' | 'updatedBy' | 'updateTime'> &
    Partial<
      Pick<
        DataSourceRecord,
        'sourceName' | 'sourceDesc' | 'sourceType' | 'host' | 'port' | 'databaseName' | 'username' | 'status'
      >
    >

  type DeleteDataSourceParams = Pick<DataSourceRecord, 'id' | 'updatedBy' | 'updateTime'>

  type UpsertDataSourceTableParams = Pick<
    DataSourceTableRecord,
    'dataSourceId' | 'tableName' | 'tableComment' | 'tableRows' | 'lastSyncTime'
  >

  type ReplaceDataSourceColumnsParams = {
    dataSourceId: number
    tableName: string
    columns: Array<
      Pick<DataSourceColumnRecord, 'columnName' | 'columnType' | 'columnComment' | 'nullable' | 'ordinalPosition'>
    >
  }
}
