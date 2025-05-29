import { GetAnswerMapper } from '../mapper/getAnswerMapper'
import { toLine } from '../utils/string-case-converter'
export class GetAnswerService {
  private getAnswerMapper: GetAnswerMapper

  constructor() {
    this.getAnswerMapper = new GetAnswerMapper()
  }

  public async getAnswer(
    requestParams: GetAnswerDto.GetAnswerParamsDto
  ): Promise<GetAnswerDao.ChartDataDao> {
    const {
      filters,
      orders,
      groups,
      dimensions,
      limit,
      dataSource
    } = requestParams

    let sql = 'select'

    dimensions.forEach(
      (item: DimensionStore.DimensionOption) => {
        /* 因为在数据库中存储的字段都是下划线 为了好看到前端层是驼峰，在进行sql查询的时候又得转成下划线 */
        if (
          groups.length > 0 &&
          !groups.some(
            (group) => group.columnName === item.columnName
          )
        ) {
          // 如果列不在 GROUP BY 中，使用聚合函数
          sql += ` MAX(${toLine(item.columnName)}) as ${item.alias ? item.alias : item.columnName},`
        } else {
          sql += ` ${toLine(item.columnName)} as ${item.alias ? item.alias : item.columnName},`
        }
      }
    )

    // 删除最后一个逗号
    sql = sql.slice(0, sql.length - 1)

    sql += ` from ${toLine(dataSource)} `

    // 拼接where语句
    if (filters.length > 0) {
      /* 因为在数据库中存储的字段都是下划线 为了好看到前端层是驼峰，在进行sql查询的时候又得转成下划线 */
      sql += ` where ${filters
        .map((item) => {
          // 兼容 filterType 和 filterValue 为 空字符串 不生成sql语句
          if (!item.filterType || !item.filterValue) {
            return ''
          }
          return `${toLine(item.columnName)} ${item.filterType} '${item.filterValue}'`
        })
        .filter((_) => _)
        .join(' and ')}`
    }

    // 拼接 order by语句
    if (orders.length > 0) {
      /* 因为在数据库中存储的字段都是下划线 为了好看到前端层是驼峰，在进行sql查询的时候又得转成下划线 */
      // sql += ` order by ${orders.map((item) => `${toLine(item.columnName)} ${item.orderType}`).join(',')}`;
      sql += `order by ${orders
        .map((item) => {
          if (item.aggregationType === 'raw') {
            return `${toLine(item.columnName)} ${item.orderType}`
          } else {
            return `${item.aggregationType}(${toLine(item.columnName)}) ${item.orderType}`
          }
        })
        .filter((_) => _)
        .join(',')}`
    }

    // 拼接 group by语句
    if (groups.length > 0) {
      /* 因为在数据库中存储的字段都是下划线 为了好看到前端层是驼峰，在进行sql查询的时候又得转成下划线 */
      sql += ` group by ${groups.map((item) => toLine(item.columnName)).join(',')}`
    }
    console.log(sql)
    sql += ` limit ${limit}`
    return this.getAnswerMapper.getAnswer(sql)
  }
}
