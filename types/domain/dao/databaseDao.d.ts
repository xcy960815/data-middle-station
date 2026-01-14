/**
 * @desc 从数据库出来的表信息
 */
declare namespace DataBaseDao {
  /**
   * @desc 左侧数据源列表
   */
  export type TableOptions = {
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
   * @desc 查询表请求参数
   */
  type GetTableOptions = {
    tableName?: string
  }

  /**
   * @desc 数字类型
   */
  export type NumberColumnType =
    | 'tinyint'
    | 'smallint'
    | 'mediumint'
    | 'int'
    | 'bigint'
    | 'decimal'
    | 'float'
    | 'double'
    | 'real'
    | 'bit'
    | 'boolean'
    | 'serial'

  /**
   * @desc 字符串类型
   */
  export type StringColumnType =
    | 'char'
    | 'varchar'
    | 'tinytext'
    | 'text'
    | 'mediumtext'
    | 'longtext'
    | 'tinyblob'
    | 'blob'
    | 'mediumblob'
    | 'longblob'
    | 'binary'
    | 'varbinary'
    | 'enum'
    | 'set'
    | 'json'
    | 'geometry'
    | 'point'
    | 'linestring'
    | 'polygon'
    | 'multipoint'
    | 'multilinestring'
    | 'multipolygon'
    | 'geometrycollection'

  /**
   * @desc 日期类型
   */
  export type DateColumnType =
    | 'date'
    | 'datetime'
    | 'timestamp'
    | 'time'
    | 'year'
    | 'datetime2'
    | 'datetimeoffset'
    | 'smalldatetime'

  export type ColumnType = NumberColumnType | StringColumnType | DateColumnType

  /**
   * @desc 左侧数据源字段类型 刚从数据库出来的字段
   */
  export type TableColumnOptions = {
    /**
     * @desc 列名
     */
    columnName: string
    /**
     * @desc 列类型（字段类型）
     */
    columnType: ColumnType
    /**
     * @desc 列注释
     */
    columnComment: string
    /**
     * @desc 是否是自定义列
     */
    isCustom?: boolean
    /**
     * @desc 自定义列表达式
     */
    expression?: string
  }

  type GetTableColumnOptions = {
    tableName: string
  }
}
