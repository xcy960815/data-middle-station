import mysql from 'mysql2/promise'

/* ========== 工具类型 & 日志 ========== */
export type Row = Record<string, string | number | boolean | null>
type ColumnMapping = Map<string, string>
type AsyncMethod = (...args: any[]) => Promise<any>
type Constructor<T = any> = new (...args: any[]) => T

export interface IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row
}

const logger = new Logger({
  fileName: 'database',
  folderName: 'database',
})

/* ========== 连接池缓存 ========== */
const pools = new Map<string, mysql.Pool>()

function getPool(name: string, config: mysql.PoolOptions): mysql.Pool {
  return pools.get(name) ?? pools.set(name, mysql.createPool(config)).get(name)!
}

/* ========== 装饰器：字段映射 & 数据源绑定 ========== */
export const entityColumnsMap = new WeakMap<Function, ColumnMapping>()

/**
 * 字段映射装饰器
 */
export function Column(columnName: string): PropertyDecorator {
  return (target, propertyKey) => {
    const constructor = target.constructor
    const mapping = entityColumnsMap.get(constructor) ?? new Map()
    mapping.set(columnName, propertyKey.toString())
    entityColumnsMap.set(constructor, mapping)
  }
}

/**
 * 将数据库行数据映射到目标对象
 */
export function mapToTarget(
  target: IColumnTarget,
  data: Array<Row> | Row,
  columnsMap?: Map<string, string>
): Array<Row> | Row {
  if (!data) return data

  const mapRowToTarget = (row: Row): Row => {
    const instance = new (target.constructor as { new (): Object })()
    columnsMap?.forEach((mapValue, mapKey) => {
      const value = row[mapKey]
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(instance), mapValue)

      if (descriptor?.set) {
        descriptor.set.call(instance, value)
      } else {
        const property = (instance as Row)[mapValue]
        if (typeof property === 'function') {
          ;(instance as Row)[mapValue] = (property as Function).call(instance, value)
        } else {
          ;(instance as Row)[mapValue] = value
        }
      }
    })

    return instance as Row
  }

  return Array.isArray(data) ? data.map(mapRowToTarget) : mapRowToTarget(data)
}

/**
 * 方法映射装饰器
 */
export function Mapping(mapping: Constructor<IColumnTarget>): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as AsyncMethod
    if (!originalMethod) {
      throw new Error('方法装饰器必须应用于方法')
    }

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args)
      return result ? mapping.prototype.columnsMapper(result) : result
    }

    return descriptor
  }
}

export abstract class BaseMapper {
  abstract dataSourceName: string

  protected async exe<R = Row[]>(sql: string, params?: any[]): Promise<R> {
    const dataSourceConfig = getDatasourceConfig()

    const config = dataSourceConfig[this.dataSourceName]

    if (!config) {
      throw new Error(`数据源 ${this.dataSourceName} 未配置`)
    }

    const pool = getPool(this.dataSourceName, config)

    try {
      const [rows] = await pool.execute(sql, params)
      return rows as R
    } catch (error: any) {
      logger.error(`SQL 执行失败: ${sql} - ${JSON.stringify(params)}\n${error.message}`)
      throw error
    }
  }
}
