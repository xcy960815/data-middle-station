/**
 * @desc 数据库相关的数据传输对象类型定义
 */
declare namespace DataBaseDto {
  /**
   * @desc 查询表列请求参数
   */
  type GetTableColumnsOptions = {
    tableName: string
  }
  /**
   * @desc 查询表请求参数
   */
  type GetTableOptions = {
    tableName?: string
  }

  /**
   * @desc 数据表 DTO
   */
  type TableOptionDto = DataBaseDao.TableOptions

  /**
   * @desc 数据列 DTO
   */
  type TableColumnDto = DataBaseDao.TableColumnOptions
}
