/**
 * IndexedDB 类型定义
 */
declare namespace IndexDB {
  /**
   * @desc 窗口与IndexedDB
   */
  export interface WindowWithIndexedDB {
    indexedDB?: IDBFactory
    webkitIndexedDB?: IDBFactory
    msIndexedDB?: IDBFactory
    mozIndexedDB?: IDBFactory
  }

  /**
   * @desc 表配置
   */
  export interface TableConfig {
    name: string
    keyPath: string
    indexes: string[]
  }

  /**
   * @desc 查询结果
   */
  export interface QueryResult<T = DataRecord> {
    total: number
    rows: T[]
  }

  /**
   * @desc 数据记录
   */
  export type DataRecord = Record<string, unknown>
}
