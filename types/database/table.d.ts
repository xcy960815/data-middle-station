

/**
 * @desc 从数据库出来的表信息
 */
declare namespace TableInfoModule {
  /**
   * @desc 左侧数据源列表
   */
  export type TableListOption = {
    tableName?: string
  }

  /**
   * @desc 左侧数据源字段类型 刚从数据库出来的字段
   */
  export type TableColumnOption = {
    columnName?: string | ((value: string) => string)
    columnType?: string | ((value: string) => string)
    columnComment?: string
    alias?: string | ((value: string) => string)
    displayName?: string | ((value: string) => string)
  }
}

