/**
 * 返还给前端的数据
 */
declare namespace DatabaseVo {
  /**
   * 表配置选项
   */
  type GetDataBaseTablesOptions = DataBaseDao.TableOptions

  /**
   * 表列配置选项
   */
  type GetTableColumnsOptions = DataBaseDao.TableColumnOptions & {
    displayName: string
  }
}
