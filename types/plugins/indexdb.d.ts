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
}
