/**
 * 返还给前端的数据
 */
declare namespace DatabaseVo {
  /**
   * 表配置
   */
  type GetDatabaseTablesResponse = DatabaseDao.TableOption

  /**
   * 左侧数据源字段类型 刚从数据库出来的字段
   */
  type GetTableColumnsResponse = DatabaseDao.TableColumnOptions & {
    displayName: string
  }
}
