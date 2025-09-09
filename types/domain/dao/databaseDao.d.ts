/**
 * @desc 从数据库出来的表信息
 */
declare namespace DatabaseDao {
  /**
   * @desc 左侧数据源列表
   */
  export type TableOption = {
    tableName: string
    tableType: string
    tableComment: string
    createTime: string
    updateTime: string
    tableRows: number
    avgRowLength: number
    dataLength: number
    indexLength: number
    autoIncrement: number
    engine: string
    tableCollation: string
    tableSize: number
  }

  /**
   * @desc 左侧数据源字段类型 刚从数据库出来的字段
   */
  type TableColumnOption = {
    columnName: string
    columnType: string
    columnComment: string
  }
}
