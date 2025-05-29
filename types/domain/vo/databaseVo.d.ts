/**
 * @desc 返还给前端的数据
 */
declare namespace DatabaseVo {
  export type TableOptionVo = {
    autoIncrement: number
    avgRowLength: number
    createTime: string
    dataLength: number
    engine: string
    indexLength: number
    tableCollation: string
    tableComment: string
    tableName: string
    tableRows: number
    tableType: string
    updateTime: string
  }

  /**
   * @desc 左侧数据源字段类型 刚从数据库出来的字段
   */
  export type TableColumnOptionVo = {
    columnName: string
    columnType: string
    columnComment: string
    alias: string
    displayName: string
  }
}
