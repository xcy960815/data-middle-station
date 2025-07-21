import { ChartDataMapper } from '../mapper/chartDataMapper'

/**
 * @desc 图表数据服务
 */
export class ChartDataService {
  /**
   * @desc 图表数据mapper
   */
  private chartDataMapper: ChartDataMapper

  /**
   * @desc 构造函数
   */
  constructor() {
    this.chartDataMapper = new ChartDataMapper()
  }

  /**
   * @desc 将dao对象转换为vo对象
   * @param chartData {ChartDataDao.ChartData} 图表数据
   * @returns {ChartDataVo.ChartData}
   */
  private dao2Vo(chartData: ChartDataDao.ChartData): ChartDataVo.ChartData {
    return chartData.map((item) => ({
      ...item,
      [item.columnName]: item.columnValue
    }))
  }

  /**
   * @desc 构建select语句
   * @param dimensions {DimensionStore.DimensionOption[]} 维度
   * @param groups {GroupStore.GroupOption[]} 分组
   * @returns {string} select语句
   */
  private buildSelectClause(dimensions: DimensionStore.DimensionOption[], groups: GroupStore.GroupOption[]): string {
    let sql = 'select'

    // 合并 dimensions 和 groups 中的列
    const allColumns = [
      ...dimensions,
      ...groups.filter((group) => !dimensions.some((dim) => dim.columnName === group.columnName))
    ]

    allColumns.forEach((item: DimensionStore.DimensionOption | GroupStore.GroupOption) => {
      const columnName = toLine(item.columnName)
      const alias = item.alias ? item.alias : item.columnName
      // 检查是否是日期时间类型的列
      const isDateTimeColumn = /date|time|created_at|updated_at/i.test(columnName)
      const fieldExpression = isDateTimeColumn ? `DATE_FORMAT(${columnName}, '%Y-%m-%d %H:%i:%s')` : columnName
      sql += ` ${fieldExpression} as \`${alias}\`,`
    })
    return sql.slice(0, sql.length - 1)
  }

  /**
   * @desc 构建where语句
   * @param filters {FilterStore.FilterOption[]} 过滤条件
   * @returns {string} where语句
   */
  private buildWhereClause(filters: FilterStore.FilterOption[]): string {
    if (filters.length === 0) return ''
    const whereClause = filters
      .map((item) => {
        if (!item.filterType || !item.filterValue) return ''
        return `${toLine(item.columnName)} ${item.filterType} '${item.filterValue}'`
      })
      .filter(Boolean)
      .join(' and ')
    return whereClause ? ` where ${whereClause}` : ''
  }

  /**
   * @desc 构建orderBy语句
   * @param orders {OrderStore.OrderOption[]} 排序条件
   * @returns {string} orderBy语句
   */
  private buildOrderByClause(orders: OrderStore.OrderOption[]): string {
    if (orders.length === 0) return ''
    const orderClause = orders
      .map((item) => {
        if (item.aggregationType === 'raw') {
          return `${toLine(item.columnName)} ${item.orderType}`
        }
        return `${item.aggregationType}(${toLine(item.columnName)}) ${item.orderType}`
      })
      .filter(Boolean)
      .join(',')
    return orderClause ? ` order by ${orderClause}` : ''
  }

  /**
   * @desc 构建groupBy语句
   * @param groups {GroupStore.GroupOption[]} 分组条件
   * @param dimensions {DimensionStore.DimensionOption[]} 维度
   * @returns {string} groupBy语句
   */
  private buildGroupByClause(groups: GroupStore.GroupOption[], dimensions: DimensionStore.DimensionOption[]): string {
    if (groups.length === 0) return ''
    // 合并 groups 和 dimensions 中的列名
    const allGroupColumns = [
      ...groups.map((item) => toLine(item.columnName)),
      ...dimensions.map((item) => toLine(item.columnName))
    ]
    return ` group by ${allGroupColumns.join(',')}`
  }

  /**
   * @desc 获取图表数据
   * @param requestParams {ChartDataDao.RequestParams} 请求参数
   * @returns {Promise<AnalyseDao.ChartData>}
   */

  public async getChartData(requestParams: ChartDataDao.RequestParams): Promise<ChartDataVo.ChartData> {
    /**
     * @desc 获取请求参数
     */
    const { filters, orders, groups, dimensions, limit, dataSource } = requestParams
    /**
     * @desc 构建select语句
     */
    const selectClause = this.buildSelectClause(dimensions, groups)
    /**
     * @desc 构建where语句
     */
    const whereClause = this.buildWhereClause(filters)
    /**
     * @desc 构建orderBy语句
     */
    const orderByClause = this.buildOrderByClause(orders)
    /**
     * @desc 构建groupBy语句
     */
    const groupByClause = this.buildGroupByClause(groups, dimensions)

    /**
     * @desc 构建sql语句
     */
    const sql = `${selectClause} from ${toLine(dataSource)}${whereClause}${groupByClause}${orderByClause} limit ${limit}`

    /**
     * @desc 获取图表数据
     */
    const data = await this.chartDataMapper.getChartData(sql)

    return this.dao2Vo(data)
  }
}
