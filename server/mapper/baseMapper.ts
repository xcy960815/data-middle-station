import mysql from 'mysql2/promise'
import chalk from 'chalk'
const logger = new Logger({
  fileName: 'database',
  folderName: 'database'
})
/**
 * @desc ts 装饰器
 * @link  https://www.cnblogs.com/winfred/p/8216650.html
 */
/**
 * @desc 数据源配置
 * @param dataSourceName { keyof DataSourceConfig}
 * @returns  {ClassDecorator}
 */
export function BindDataSource(
  dataSourceName: string
): ClassDecorator {
  return function (target) {
    target.prototype.dataSourceName = dataSourceName
    return target
  }
}

type Row = Record<string, string | number | boolean | null>

type ColumnMapper = (
  data: Array<Row> | Row
) => Array<Row> | Row

function mapToTarget(
  target: Object & {
    columnsMap?: Map<string, string>
    columnsMapper?: ColumnMapper
  },
  data: Array<Row> | Row,
  columnsMap?: Map<string, string>
): Array<Row> | Row {
  const mapRowToTarget = (row: Row): Row => {
    const instance = new (
      target as { constructor: new () => Object }
    ).constructor()
    columnsMap?.forEach((mapValue, mapKey) => {
      let instanceProperty = (
        instance as Record<
          string,
          string | number | boolean | null
        >
      )[mapValue]

      if (typeof instanceProperty === 'function') {
        ;(
          instance as Record<
            string,
            string | number | boolean | null
          >
        )[mapValue] = (instanceProperty as Function).call(
          instance,
          row[mapKey]
        )
      } else {
        // 先尝试 setter
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(instance),
          mapValue
        )
        const setter = descriptor?.set
        if (typeof setter === 'function') {
          setter.call(instance, row[mapKey])
        } else {
          ;(
            instance as Record<
              string,
              string | number | boolean | null
            >
          )[mapValue] = row[mapKey]
        }
      }
    })

    return instance as Row
  }

  if (!data) return data

  return Array.isArray(data)
    ? data.map((row) => mapRowToTarget(row))
    : mapRowToTarget(data)
}
/**
 * @desc 映射 数据库字段到实体类属性
 * @param columnName {string}
 * @returns {PropertyDecorator}
 */
export function Column(
  columnName: string
): PropertyDecorator {
  return function (
    target: Object & {
      columnsMap?: Map<string, string>
      columnsMapper?: ColumnMapper
    },
    propertyKey: string | symbol
  ) {
    const columnsMap = target['columnsMap'] || new Map()
    columnsMap.set(columnName, propertyKey)
    if (!target['columnsMap']) {
      target['columnsMap'] = columnsMap
      target['columnsMapper'] = (data) =>
        mapToTarget(target, data, columnsMap)
    }
  }
}
/**
 * @description 执行 映射 业务查询结果到实体类
 * @param mapping {Function}
 * @returns {MethodDecorator}
 */
export function Mapping(mapping: {
  new (): Object
}): MethodDecorator {
  return function (
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const originalMethod = descriptor.value
    descriptor.value = async function () {
      const originValue = await originalMethod.apply(
        this,
        arguments
      )
      if (mapping) {
        return mapping.prototype['columnsMapper'](
          originValue
        )
      } else {
        return originValue
      }
    }
    return descriptor
  }
}

/**
 * @desc 数据库操作基类
 */
export class BaseMapper {
  // 线程池
  private poolMap: Map<string, mysql.Pool> = new Map()
  // 查找线程池
  private getPool(dataSourceName: string): mysql.Pool {
    let pool = this.poolMap.get(dataSourceName)
    if (!pool) {
      const dataSourceConfig = getDatasourceConfig()
      const currentDataSourceConfig: mysql.PoolOptions =
        dataSourceConfig[dataSourceName]
      // 创建连接池
      pool = mysql.createPool(currentDataSourceConfig)
      this.poolMap.set(dataSourceName, pool)
    }
    return pool
  }
  /**
   * @desc 执行sql
   * @param sql {string}
   * @param params {Array<any>}
   * @returns  {Promise<T>}
   */
  protected async exe<T>(
    sql: string,
    params?: Array<any>
  ): Promise<T> {
    const dataSourceName =
      Object.getPrototypeOf(this).dataSourceName
    //  查找线程池
    const pool = this.getPool(dataSourceName)
    // 获取连接
    const sqlContainer = await pool.getConnection()
    const startTime = Date.now()
    logger.info(
      `${chalk.green('请求')} ${sql} 请求参数 ${chalk.blue(params ? params : '无')} `
    )
    const queryResult = await sqlContainer
      .query(sql, params)
      .then(([result]) => {
        const duration = Date.now() - startTime
        logger.info(
          `${chalk.green('耗时')} ${chalk.blue(duration)} ms`
        )
        // 请求结果
        logger.info(
          `${chalk.green('结果')} ${chalk.blue(JSON.stringify(result, null, 2))}`
        )
        return result
      })
      .catch((error) => {
        logger.error(
          `${sql} 请求参数 ${params ? params : '无'} error ${error}`
        )
        throw error
      })
      .finally(() => {
        sqlContainer && sqlContainer.release()
      })

    return queryResult as T
  }
}
