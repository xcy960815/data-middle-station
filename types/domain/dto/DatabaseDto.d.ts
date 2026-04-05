/**
 * @desc 数据库相关的数据传输对象类型定义
 */
declare namespace DatabaseDto {
  /**
   * @desc 查询表列请求参数
   */
  type GetTableColumnsOptions = {
    tableName: string
  }
  /**
   * @desc 查询表请求参数
   */
  type GetDatabaseTablesOptions = {
    tableName?: string
  }

  /**
   * @desc 数据表 DTO
   */
  type TableDto = DatabaseDao.TableOptions

  /**
   * @desc 数据列 DTO
   */
  type TableColumnDto = DatabaseDao.TableColumnOptions
}
