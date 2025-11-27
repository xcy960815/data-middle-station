/**
 * 返还给前端的数据
 */
declare namespace DatabaseVo {
  /**
   * 表配置响应
   */
  type GetDataBaseTablesResponse = DataBaseDao.TableOptions

  /**
   * 表列配置响应
   */
  type GetTableColumnsResponse = DataBaseDao.TableColumnOptions & {
    displayName: string
  }
}
