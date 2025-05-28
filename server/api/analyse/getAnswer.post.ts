import { GetAnswerDao } from '../../database/getAnswer'
import { Response } from '../../database/response'
import { toLine } from '../../database/utils'
/**
 * 这是一个很重要的接口，动态拼接sql 动态查询
 */
interface ChartDataParamsDto {
  dataSource: string
  filters: Array<FilterStore.FilterOptionDto>
  orders: Array<OrderStore.OrderOptionDto>
  groups: Array<GroupStore.GroupOptionDto>
  dimensions: Array<DimensionStore.DimensionOption>
  limit: number
}

type ChartDataDao = Array<{
  [key: string]: string | number
}>

/**
 * @desc 查询图表数据
 * @param {QueryChartDataParams} params
 * @returns {Promise<ResponseModule.Response<ChartDataDao>>}
 */
export default defineEventHandler<
  Promise<ResponseModule.Response<ChartDataDao>>
>(async (event) => {
  try {
    const {
      dimensions,
      groups,
      dataSource,
      orders,
      filters,
      limit
    } = await readBody<ChartDataParamsDto>(event)

    const getAnswerInstance = new GetAnswerDao()

    let sql = 'select'

    dimensions.forEach(
      (item: DimensionStore.DimensionOption) => {
        /* 因为在数据库中存储的字段都是下划线 为了好看到前端层是驼峰，在进行sql查询的时候又得转成下划线 */
        sql += ` ${toLine(item.columnName)} as ${item.alias ? item.alias : item.columnName},`
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

    sql += ` limit ${limit}`

    const data =
      await getAnswerInstance.exe<ChartDataDao>(sql)

    return Response.success(data)
  } catch (error: any) {
    console.error(error)
    return Response.error(error.message)
  }
})
