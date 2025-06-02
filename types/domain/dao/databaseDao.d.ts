/**
 * @desc 从数据库出来的表信息
 */
declare namespace DatabaseDao {
  /**
   * @desc 左侧数据源列表
   */
  export type TableOption = {
    tableName: string | ((value: string) => string)
    tableType: string | ((value: string) => string)
    tableComment: string
    createTime: string | ((value: string) => string)
    updateTime: string | ((value: string) => string)
    tableRows: number
    avgRowLength: number
    dataLength: number
    indexLength: number
    autoIncrement: number
    engine: string | ((value: string) => string)
    tableCollation: string | ((value: string) => string)
    tableSize: number
  }

  /**
   * @desc 左侧数据源字段类型 刚从数据库出来的字段
   */
  type TableColumnOption = {
    columnName: string | ((value: string) => string)
    columnType: string | ((value: string) => string)
    columnComment: string
  }
}
