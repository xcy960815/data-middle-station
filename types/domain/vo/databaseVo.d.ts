/**
 * 返还给前端的数据
 */
declare namespace DatabaseVo {
  /**
   * 表配置
   */
  type GetDataBaseTablesOptions = DataBaseDao.TableOptions

  /**
   * 左侧数据源字段类型 刚从数据库出来的字段
   */
  type GetTableColumnsOptions = DataBaseDao.TableColumnOptions & {
    displayName: string
  }
}
