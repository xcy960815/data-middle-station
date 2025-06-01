import { ChartDataMapper } from '../mapper/chartDataMapper'

/**
 * @desc 图表数据服务
 */
export class ChartDataService {
  private chartDataMapper: ChartDataMapper

  constructor() {
    this.chartDataMapper = new ChartDataMapper()
  }

  /**
   * @desc 构建select语句
   * @param dimensions {DimensionStore.DimensionOption[]} 维度
   * @param groups {GroupStore.GroupOption[]} 分组
   * @returns {string} select语句
   */
  private buildSelectClause(
    dimensions: DimensionStore.DimensionOption[],
    groups: GroupStore.GroupOption[]
  ): string {
    let sql = 'select'
    dimensions.forEach(
      (item: DimensionStore.DimensionOption) => {
        const columnName = toLine(item.columnName)
        const alias = item.alias
          ? item.alias
          : item.columnName
        const needAggregation =
          groups.length > 0 &&
          !groups.some(
            (group) => group.columnName === item.columnName
          )
        const aggregationFunction = needAggregation
          ? 'MAX'
          : ''
        const fieldExpression = aggregationFunction
          ? `${aggregationFunction}(${columnName})`
          : columnName
        sql += ` ${fieldExpression} as \`${alias}\`,`
      }
    )
    return sql.slice(0, sql.length - 1)
  }

  /**
   * @desc 构建where语句
   * @param filters {FilterStore.FilterOption[]} 过滤条件
   * @returns {string} where语句
   */
  private buildWhereClause(
    filters: FilterStore.FilterOption[]
  ): string {
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
  private buildOrderByClause(
    orders: OrderStore.OrderOption[]
  ): string {
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
   * @returns {string} groupBy语句
   */
  private buildGroupByClause(
    groups: GroupStore.GroupOption[]
  ): string {
    if (groups.length === 0) return ''
    return ` group by ${groups.map((item) => toLine(item.columnName)).join(',')}`
  }

  /**
   * @desc 获取答案
   * @param requestParams {GetAnswerDto.GetAnswerParamsDto} 请求参数
   * @returns {Promise<ChartDataDao.ChartData>} 答案
   */

  public async getChartData(
    requestParams: GetAnswerDto.GetAnswerParamsDto
  ): Promise<ChartDataDao.ChartData> {
    const {
      filters,
      orders,
      groups,
      dimensions,
      limit,
      dataSource
    } = requestParams

    const selectClause = this.buildSelectClause(
      dimensions,
      groups
    )
    const whereClause = this.buildWhereClause(filters)
    const orderByClause = this.buildOrderByClause(orders)
    const groupByClause = this.buildGroupByClause(groups)

    const sql = `${selectClause} from ${toLine(dataSource)}${whereClause}${groupByClause}${orderByClause} limit ${limit}`

    const data =
      await this.chartDataMapper.getChartData(sql)
    return data
  }
}
