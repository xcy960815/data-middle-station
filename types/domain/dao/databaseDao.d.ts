/**
 * @desc 从数据库出来的表信息
 */
declare namespace DatabaseDao {
  /**
   * @desc 左侧数据源列表
   */
  export type TableOption = {
    /**
     * @desc 表名
     */
    tableName: string
    /**
     * @desc 表类型
     */
    tableType: string
    /**
     * @desc 表注释
     */
    tableComment: string
    /**
     * @desc 创建时间
     */
    createTime: string
    /**
     * @desc 更新时间
     */
    updateTime: string
    /**
     * @desc 表行数
     */
    tableRows: number
    /**
     * @desc 平均行长度
     */
    avgRowLength: number
    /**
     * @desc 数据长度
     */
    dataLength: number
    /**
     * @desc 索引长度
     */
    indexLength: number
    /**
     * @desc 自动递增
     */
    autoIncrement: number
    /**
     * @desc 引擎
     */
    engine: string
    /**
     * @desc 表排序规则
     */
    tableCollation: string
    /**
     * @desc 表大小
     */
    tableSize: number
  }

  /**
   * @desc 左侧数据源字段类型 刚从数据库出来的字段
   */
  type TableColumnOptions = {
    /**
     * @desc 列名
     */
    columnName: string
    /**
     * @desc 列类型
     */
    columnType: string
    /**
     * @desc 列注释
     */
    columnComment: string
  }
}
