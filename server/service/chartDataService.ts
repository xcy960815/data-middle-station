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
   * @param chartDataDaoList {AnalyzeDataDao.ChartData[]} 图表数据DAO列表
   * @returns {AnalyzeDataVo.ChartData[]} 图表数据VO列表
   */
  private convertDaoToVo(chartDataDaoList: Array<AnalyzeDataDao.ChartData>): Array<AnalyzeDataVo.ChartData> {
    return chartDataDaoList.map((chartDataDao) => ({
      ...chartDataDao,
      [String(chartDataDao.columnName)]: chartDataDao.columnValue
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
      // 检查是否是日期时间类型的列
      const isDateTimeColumn = /date|time|created_at|updated_at/i.test(columnName)
      const fieldExpression = isDateTimeColumn ? `DATE_FORMAT(${columnName}, '%Y-%m-%d %H:%i:%s')` : columnName
      selectClause += ` ${fieldExpression},`
    })
    return selectClause.slice(0, selectClause.length - 1)
  }

  /**
   * @desc 构建where语句
   * @param filterOptions {AnalyzeDataDto.FilterOption[]} 过滤条件
   * @returns {string} where语句
   */
  private buildWhereClause(filterOptions: AnalyzeDataDto.FilterOption[]): string {
    if (filterOptions.length === 0) return ''
    const whereClause = filterOptions
      .map((filterOption) => {
        if (!filterOption.filterType || !filterOption.filterValue) return ''
        return `${toLine(filterOption.columnName)} ${filterOption.filterType} '${filterOption.filterValue}'`
      })
      .filter(Boolean)
      .join(' and ')
    return whereClause ? ` where ${whereClause}` : ''
  }

  /**
   * @desc 构建orderBy语句
   * @param orderOptions {AnalyzeDataDto.OrderOption[]} 排序条件
   * @returns {string} orderBy语句
   */
  private buildOrderByClause(orderOptions: AnalyzeDataDto.OrderOption[]): string {
    if (orderOptions.length === 0) return ''
    const orderClause = orderOptions
      .map((orderOption) => {
        if (orderOption.aggregationType === 'raw') {
          return `${toLine(orderOption.columnName)} ${orderOption.orderType}`
        }
        return `${orderOption.aggregationType}(${toLine(orderOption.columnName)}) ${orderOption.orderType}`
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
      ...groupOptions.map((groupOption) => toLine(groupOption.columnName)),
      ...dimensions.map((dimensionOption) => toLine(dimensionOption.columnName))
    ]
    return ` group by ${allGroupColumns.join(',')}`
  }

  /**
   * @desc 获取图表数据
   * @param chartDataRequest {AnalyzeDataDto.ChartDataOptions} 请求参数
   * @returns {Promise<AnalyzeDataVo.ChartData[]>} 图表数据VO列表
   */
  public async getAnalyzeData(
    chartDataRequest: AnalyzeDataDto.ChartDataOptions
  ): Promise<Array<AnalyzeDataVo.ChartData>> {
    // 归一化请求参数，确保数组字段不为空
    const normalizedRequest: AnalyzeDataDto.ChartDataOptions = {
      ...chartDataRequest,
      filters: chartDataRequest.filters || [],
      orders: chartDataRequest.orders || [],
      groups: chartDataRequest.groups || [],
      dimensions: chartDataRequest.dimensions || []
    }

    /**
     * @desc 构建select语句
     */
    const selectClause = this.buildSelectClause(normalizedRequest.dimensions, normalizedRequest.groups)
    /**
     * @desc 构建where语句
     */
    const whereClause = this.buildWhereClause(normalizedRequest.filters)
    /**
     * @desc 构建orderBy语句
     */
    const orderByClause = this.buildOrderByClause(normalizedRequest.orders)
    /**
     * @desc 构建groupBy语句
     */
    const groupByClause = this.buildGroupByClause(normalizedRequest.groups, normalizedRequest.dimensions)

    /**
     * @desc 构建sql语句
     */
    const sql = `${selectClause} from ${toLine(
      normalizedRequest.dataSource
    )}${whereClause}${groupByClause}${orderByClause} limit ${normalizedRequest.commonChartConfig?.limit || 1000}`

    /**
     * @desc 获取图表数据
     */
    const chartDataDaoList = await this.chartDataMapper.getAnalyzeData(sql)

    return this.convertDaoToVo(chartDataDaoList)
  }
}
