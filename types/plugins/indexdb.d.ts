/**
 * IndexedDB 类型定义
 */
declare namespace IndexDB {
  export interface WindowWithIndexedDB {
    indexedDB?: IDBFactory
    webkitIndexedDB?: IDBFactory
    msIndexedDB?: IDBFactory
    mozIndexedDB?: IDBFactory
  }

  export interface TableConfig {
    name: string
    keyPath: string
    indexes: string[]
  }

  export interface QueryResult<T = DataRecord> {
    total: number
    rows: T[]
  }

  export type DataRecord = Record<string, unknown>

  export interface Manager {
    openDatabase(databaseName: string, version: number): Promise<IDBDatabase | null>
    deleteDatabase(databaseName: string): Promise<boolean>
    closeDatabase(database: IDBDatabase): void

    deleteData(
      database: IDBDatabase,
      storeName: string,
      indexName: string,
      searchValue: string | number
    ): Promise<boolean>
    clearData(database: IDBDatabase, storeName: string): Promise<boolean>

    addData<T extends DataRecord>(database: IDBDatabase, storeName: string, dataList: T[]): void
    addDataAsync<T extends DataRecord>(database: IDBDatabase, storeName: string, dataList: T[]): Promise<void>
    /** @deprecated use addDataAsync */
    newAddData<T extends DataRecord>(database: IDBDatabase, storeName: string, dataList: T[]): Promise<void>
    updateData<T extends DataRecord>(database: IDBDatabase, storeName: string, dataList: T[]): Promise<boolean>

    getData<T extends DataRecord>(
      database: IDBDatabase,
      storeName: string,
      primaryKey: IDBValidKey
    ): Promise<T | undefined>
    getDataByPage<T extends DataRecord>(
      database: IDBDatabase,
      storeName: string,
      indexName: string,
      searchValue: IDBValidKey,
      page?: number,
      pageSize?: number
    ): Promise<QueryResult<T>>
    getDataByone<T extends DataRecord>(
      database: IDBDatabase,
      storeName: string,
      indexName: string,
      searchValue: IDBValidKey
    ): Promise<T[]>
    getAllData<T extends DataRecord>(database: IDBDatabase, storeName: string): Promise<T[]>
    getDataByoneWithSort<T extends DataRecord>(
      database: IDBDatabase,
      storeName: string,
      indexName: string,
      searchValue: IDBValidKey,
      sortField?: string
    ): Promise<T[]>
    checkAndAdd<T extends DataRecord>(
      database: IDBDatabase,
      storeName: string,
      fieldName: string,
      fieldValue: IDBValidKey,
      dataRecord: T
    ): Promise<string>
    getEarliestByCreateTime<T extends DataRecord>(database: IDBDatabase, storeName: string): Promise<T | null>
    deleteDataByCondition(
      database: IDBDatabase,
      storeName: string,
      fieldName: string,
      fieldValue: unknown
    ): Promise<number>
    getDataByConditions<T extends DataRecord>(
      database: IDBDatabase,
      storeName: string,
      queryConditions: DataRecord
    ): Promise<T[]>

    utcDate(val: string | number | Date): string
  }
}

declare module '#app' {
  interface NuxtApp {
    $indexdb: IndexDB.Manager
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $indexdb: IndexDB.Manager
  }
}
