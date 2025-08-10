/**
 * @desc 返还给前端的数据
 */
declare namespace DatabaseVo {
  /**
   * @desc 表配置
   */
  type TableOption = {
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
  type TableColumnOption = {
    columnName: string
    columnType: string
    columnComment: string
    alias: string
    displayName: string
    fixed?: 'left' | 'right' | null
    align?: 'left' | 'right' | null
    width?: number
  }
}
