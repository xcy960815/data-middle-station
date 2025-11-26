/**
 * @desc 数据库相关的数据传输对象类型定义
 */
declare namespace DatabaseDto {
  /**
   * @desc 查询表列请求参数
   */
  type GetTableColumnsRequest = {
    tableName: string
  }
  /**
   * @desc 查询表请求参数
   */
  type GetDatabaseTablesRequest = {
    tableName?: string
  }

  /**
   * @desc 数据表 DTO
   */
  type TableOptionDto = DataBaseDao.TableOption

  /**
   * @desc 数据列 DTO
   */
  type TableColumnDto = DataBaseDao.TableColumnOptions
}
