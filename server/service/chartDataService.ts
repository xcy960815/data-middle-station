import { ChartDataMapper } from '@/server/mapper/chartDataMapper'

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
   * @desc 将DAO对象转换为VO对象
   * @param chartDataRecords {AnalyzeDataDao.ChartData[]} 图表数据DAO列表
   * @returns {AnalyzeDataVo.AnalyzeData[]} 图表数据VO列表
   */
  private convertDaoToVo(chartDataRecords: Array<AnalyzeDataDao.AnalyzeData>): Array<AnalyzeDataVo.AnalyzeData> {
    return chartDataRecords.map((chartDataRecord) => ({
      ...chartDataRecord,
      [String(chartDataRecord.columnName)]: chartDataRecord.columnValue
    }))
  }

  /**
   * @desc 构建select语句
   * @param dimensions {AnalyzeDataDto.DimensionOption[]} 维度
   * @param groups {AnalyzeDataDto.GroupOption[]} 分组
   * @returns {string} select语句
   */
  private buildSelectClause(
    dimensions: AnalyzeDataDto.DimensionOption[],
    groups: AnalyzeDataDto.GroupOption[]
  ): string {
    let selectClause = 'select'

    // 合并 dimensions 和 groups 中的列
    const allColumns = [
      ...dimensions,
      ...groups.filter((group) => !dimensions.some((dim) => dim.columnName === group.columnName))
    ]

    allColumns.forEach((columnOption: AnalyzeDataDto.DimensionOption | AnalyzeDataDto.GroupOption) => {
      const columnName = toLine(columnOption.columnName)

      // 处理自定义列
      if (columnOption.isCustom && columnOption.expression) {
        selectClause += ` ${columnOption.expression} AS ${columnName},`
        return
      }

      // 检查是否是日期时间类型的列
      const isDateTimeColumn = /date|time|created_at|updated_at/i.test(columnName)
      const fieldExpression = isDateTimeColumn ? `DATE_FORMAT(${columnName}, '%Y-%m-%d %H:%i:%s')` : columnName
      selectClause += ` ${fieldExpression},`
    })
    return selectClause.slice(0, selectClause.length - 1)
  }

  /**
   * @desc 构建where语句
   * @param filterOptions {AnalyzeDataDto.FilterOptions[]} 过滤条件
   * @returns {string} where语句
   */
  private buildWhereClause(filterOptions: AnalyzeDataDto.FilterOptions[]): string {
    if (filterOptions.length === 0) return ''
    const whereClause = filterOptions
      .map((filterOption) => {
        if (!filterOption.filterType || !filterOption.filterValue) return ''
        const columnExpression =
          filterOption.isCustom && filterOption.expression ? filterOption.expression : toLine(filterOption.columnName)
        return `${columnExpression} ${filterOption.filterType} '${filterOption.filterValue}'`
      })
      .filter(Boolean)
      .join(' and ')
    return whereClause ? ` where ${whereClause}` : ''
  }

  /**
   * @desc 构建orderBy语句
   * @param orderOptions {AnalyzeDataDto.OrderOptions[]} 排序条件
   * @param hasGroupBy {boolean} 是否有分组
   * @returns {string} orderBy语句
   */
  private buildOrderByClause(orderOptions: AnalyzeDataDto.OrderOptions[], hasGroupBy: boolean): string {
    if (orderOptions.length === 0) return ''
    const orderClause = orderOptions
      .map((orderOption) => {
        const columnExpression =
          orderOption.isCustom && orderOption.expression ? orderOption.expression : toLine(orderOption.columnName)
        // 如果没有分组，或者聚合类型是 raw，则不使用聚合函数
        if (!hasGroupBy || orderOption.aggregationType === 'raw') {
          return `${columnExpression} ${orderOption.orderType}`
        }
        return `${orderOption.aggregationType}(${columnExpression}) ${orderOption.orderType}`
      })
      .filter(Boolean)
      .join(',')
    return orderClause ? ` order by ${orderClause}` : ''
  }

  /**
   * @desc 构建groupBy语句
   * @param groupOptions {AnalyzeDataDto.GroupOption[]} 分组条件
   * @param dimensions {AnalyzeDataDto.DimensionOption[]} 维度
   * @returns {string} groupBy语句
   */
  private buildGroupByClause(
    groupOptions: AnalyzeDataDto.GroupOption[],
    dimensions: AnalyzeDataDto.DimensionOption[]
  ): string {
    if (groupOptions.length === 0) return ''
    // 合并 groups 和 dimensions 中的列名
    const allGroupColumns = [
      ...groupOptions.map((groupOption) =>
        groupOption.isCustom && groupOption.expression ? groupOption.expression : toLine(groupOption.columnName)
      ),
      ...dimensions.map((dimensionOption) =>
        dimensionOption.isCustom && dimensionOption.expression
          ? dimensionOption.expression
          : toLine(dimensionOption.columnName)
      )
    ]
    return ` group by ${allGroupColumns.join(',')}`
  }

  /**
   * @desc 获取图表数据
   * @param queryOptions {AnalyzeDataDto.ChartDataOptions} 请求参数
   * @returns {Promise<AnalyzeDataVo.AnalyzeData[]>} 图表数据VO列表
   */
  public async getAnalyzeData(
    queryOptions: AnalyzeDataDto.ChartDataOptions
  ): Promise<Array<AnalyzeDataVo.AnalyzeData>> {
    // 归一化请求参数，确保数组字段不为空
    const normalizedOptions: AnalyzeDataDto.ChartDataOptions = {
      ...queryOptions,
      filters: queryOptions.filters || [],
      orders: queryOptions.orders || [],
      groups: queryOptions.groups || [],
      dimensions: queryOptions.dimensions || []
    }

    /**
     * @desc 构建select语句
     */
    const selectClause = this.buildSelectClause(normalizedOptions.dimensions, normalizedOptions.groups)
    /**
     * @desc 构建where语句
     */
    const whereClause = this.buildWhereClause(normalizedOptions.filters)
    /**
     * @desc 构建orderBy语句
     */
    const hasGroupBy = normalizedOptions.groups.length > 0
    const orderByClause = this.buildOrderByClause(normalizedOptions.orders, hasGroupBy)
    /**
     * @desc 构建groupBy语句
     */
    const groupByClause = this.buildGroupByClause(normalizedOptions.groups, normalizedOptions.dimensions)

    /**
     * @desc 构建sql语句
     */
    const sql = `${selectClause} from ${toLine(
      normalizedOptions.dataSource
    )}${whereClause}${groupByClause}${orderByClause} limit ${normalizedOptions.commonChartConfig?.limit || 1000}`

    /**
     * @desc 获取图表数据
     */
    const chartDataRecords = await this.chartDataMapper.getAnalyzeData(sql)

    return this.convertDaoToVo(chartDataRecords)
  }
}
