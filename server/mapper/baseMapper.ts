import mysql from 'mysql2/promise'
import chalk from 'chalk'

const logger = new Logger({
  fileName: 'database',
  folderName: 'database'
})

// ================== 类型声明区 ==================
/**
 * 表示一行数据
 */
export type Row = Record<
  string,
  string | number | boolean | null
>

/**
 * 列映射函数类型
 */
export type ColumnMapper = (
  data: Array<Row> | Row
) => Array<Row> | Row

/**
 * 用于装饰器和实体映射的目标对象类型
 */
export interface IColumnTarget {
  columnsMap?: Map<string, string>
  columnsMapper?: ColumnMapper
}

/**
 * 异步方法类型
 */
export type AsyncMethod = (
  ...args: any[]
) => Promise<Array<Row> | Row>

/**
 * Mapper接口
 */
export interface IBaseMapper {
  dataSourceName: string
  exe<T>(sql: string, params?: Array<any>): Promise<T>
}

// ================== 业务代码区 ==================

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
  return function <T extends { prototype: IBaseMapper }>(
    target: T
  ): T {
    target.prototype.dataSourceName = dataSourceName
    return target
  }
}

function mapToTarget(
  target: Object & IColumnTarget,
  data: Array<Row> | Row,
  columnsMap?: Map<string, string>
): Array<Row> | Row {
  const mapRowToTarget = (row: Row): Row => {
    const instance = new (
      target as { constructor: new () => Object }
    ).constructor()
    columnsMap?.forEach((mapValue, mapKey) => {
      let instanceProperty = (instance as Row)[mapValue]

      if (typeof instanceProperty === 'function') {
        ;(instance as Row)[mapValue] = (
          instanceProperty as Function
        ).call(instance, row[mapKey])
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
          ;(instance as Row)[mapValue] = row[mapKey]
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
    target: IColumnTarget,
    propertyKey: string | symbol
  ) {
    const columnsMap =
      target.columnsMap || new Map<string, string>()
    columnsMap.set(columnName, String(propertyKey))
    if (!target.columnsMap) {
      target.columnsMap = columnsMap
      target.columnsMapper = (data) =>
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
  new (): IColumnTarget
}): MethodDecorator {
  return function (
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as AsyncMethod
    if (!originalMethod) {
      throw new Error('方法装饰器必须应用于方法')
    }
    descriptor.value = async function (...args: any[]) {
      const originValue = await originalMethod.apply(
        this,
        args
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
export abstract class BaseMapper implements IBaseMapper {
  /**
   * @desc 数据源名称
   */
  abstract dataSourceName: string
  /**
   * @desc 线程池
   */
  private poolMap: Map<string, mysql.Pool> = new Map()
  /**
   * @desc 查找线程池
   */
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
  public async exe<T>(
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

// import mysql from 'mysql2/promise'

// /* ========== 工具类型 & 日志 ========== */
// type Row = Record<string, string | number | boolean | null>
// type ColumnMapping = Map<string, string>

// const logger = {
//   info: console.log,
//   error: console.error,
// }

// /* ========== 连接池缓存 ========== */
// const pools: Map<string, mysql.Pool> = new Map()

// function getPool(name: string, config: mysql.PoolOptions): mysql.Pool {
//   if (!pools.has(name)) {
//     pools.set(name, mysql.createPool(config))
//   }
//   return pools.get(name)!
// }

// /* ========== 装饰器：字段映射 & 数据源绑定 ========== */
// const entityColumnsMap: WeakMap<Function, ColumnMapping> = new WeakMap()

// const entityDataSourceMap: WeakMap<Function, string> = new WeakMap()

// export function Column(columnName: string): PropertyDecorator {
//   return (target, propertyKey) => {
//     const ctor = target.constructor
//     if (!entityColumnsMap.has(ctor)) {
//       entityColumnsMap.set(ctor, new Map())
//     }
//     entityColumnsMap.get(ctor)!.set(columnName, propertyKey.toString())
//   }
// }

// /**
//  * @desc 数据源绑定
//  * @param name {string}
//  * @returns {ClassDecorator}
//  */
// export function BindDataSource(name: string): ClassDecorator {
//   return (target) => {
//     entityDataSourceMap.set(target, name)
//   }
// }

// /* ========== 通用 BaseMapper ========== */
// export abstract class BaseMapper<T extends Row = Row> {
//   private mapRow(row: Row): T {
//     const ctor = this.constructor as Function
//     const mapping = entityColumnsMap.get(ctor)
//     if (!mapping) return row as T

//     const instance: any = {}
//     for (const [dbField, prop] of mapping.entries()) {
//       instance[prop] = row[dbField]
//     }
//     return instance as T
//   }

//   protected async query<R = Row[]>(sql: string, params?: any[]): Promise<R> {
//     const constructor = this.constructor as Function
//     const ds = entityDataSourceMap.get(constructor)
//     if (!ds) throw new Error('Mapper 类未使用 @BindDataSource')

//     const pool = getPool(ds, {
//       host: 'localhost',
//       user: 'root',
//       password: '123456',
//       database: 'kanban_data',
//       port: 3308,
//       connectionLimit: 10,
//     })

//     try {
//       const [rows] = await pool.execute(sql, params)
//       return rows as R
//     } catch (error: any) {
//       logger.error(`SQL 失败: ${sql} - ${JSON.stringify(params)}\n${error.message}`)
//       throw error
//     }
//   }

//   protected async queryRows(sql: string, params?: any[]): Promise<T[]> {
//     const rows = await this.query<Row[]>(sql, params)
//     return rows.map((r) => this.mapRow(r))
//   }

//   protected async queryOne(sql: string, params?: any[]): Promise<T | null> {
//     const rows = await this.queryRows(sql, params)
//     return rows[0] ?? null
//   }
// }
