/**
 * @desc 数据库相关的数据传输对象类型定义
 */
declare namespace DatabaseDto {
  /**
   * @desc 查询表列请求参数
   */
  type TableColumnRequest = {
    tableName: string
  }
  /**
   * @desc 查询表请求参数
   */
  type QueryTableRequest = {
    tableName: string
  }
}
