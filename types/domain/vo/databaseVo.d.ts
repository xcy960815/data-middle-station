/**
 * @desc 返还给前端的数据
 */
declare namespace DatabaseVo {
  /**
   * @desc 表配置
   */
  type TableOption = DatabaseDao.TableOption

  /**
   * @desc 左侧数据源字段类型 刚从数据库出来的字段
   */
  type TableColumnOption = DatabaseDao.TableColumnOption & {
    displayName: string
  }
}
