import { Logger } from '@/server/utils/logger'

/* ========== 工具类型 & 日志 ========== */

/**
 * @desc 通用数据行类型，键为列名，值为基础类型或 null
 */
export type Row = Record<string, string | number | boolean | null>
type ColumnMapping = Map<string, string>
type AsyncMethod = (...args: any[]) => Promise<any>
type Constructor<T = any> = new (...args: any[]) => T

/**
 * @desc 支持列映射的目标类型
 */
export interface IColumnTarget {
  /**
   * @desc 将原始查询结果映射为目标对象/对象数组
   * @param data 原始数据库行数据，可以是单行或多行
   * @returns 映射后的对象或对象数组
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row
}

/**
 * @desc mapper 模块专用日志实例
 */
const logger = new Logger({
  fileName: 'database',
  folderName: 'database'
})

/* ========== 装饰器：字段映射 & 数据源绑定 ========== */
export const entityColumnsMap = new WeakMap<Function, ColumnMapping>()

/**
 * @desc 字段映射装饰器
 * @param columnName 数据库中的列名
 * @description
 * 将数据库列与实体类属性建立映射关系，
 * 后续通过 `mapToTarget` 自动完成行数据到实体的转换。
 */
export function Column(columnName: string): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const constructor = target.constructor
    const mapping = entityColumnsMap.get(constructor) ?? new Map()
    mapping.set(columnName, propertyKey.toString())
    entityColumnsMap.set(constructor, mapping)
  }
}

/**
 * @desc 将数据库行数据映射到目标对象
 * @param target 映射目标实例（一般为 *Mapping 类的实例）
 * @param data 原始查询结果，可以是单行或多行
 * @param columnsMap 列名到实体属性名的映射表
 * @returns 映射后的结果，类型与入参 `data` 保持一致
 */
export function mapToTarget(
  target: IColumnTarget,
  data: Array<Row> | Row,
  columnsMap?: Map<string, string>
): Array<Row> | Row {
  if (!data) return data

  const mapRowToTarget = (row: Row): Row => {
    const instance = new (target.constructor as {
      new (): Object
    })()
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
 * @desc 方法映射装饰器
 * @param mapping 列映射类的构造函数，用于将查询结果转换为领域实体
 * @description
 * 装饰异步 mapper 方法，使其返回值自动通过对应的 *Mapping.columnsMapper 进行字段映射。
 */
export function Mapping(mapping: Constructor<IColumnTarget>): MethodDecorator {
  return (_target: Object, _propertyKey: string | symbol, descriptor?: PropertyDescriptor) => {
    if (!descriptor) {
      throw new Error('装饰器必须应用于有描述符的属性')
    }
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

/**
 * @desc 基础映射器，封装通用的数据源与 SQL 执行逻辑
 */
export abstract class BaseMapper {
  /**
   * @desc 数据源名称，对应 `useNitroApp().mysqlPools` 中的 key
   */
  abstract dataSourceName: string

  /**
   * @desc 执行 SQL 并返回查询结果
   * @param sql 需要执行的 SQL 语句
   * @param params 预编译参数数组（可选）
   * @returns 查询结果数组，默认类型为 `Row[]`
   */
  protected async exe<R = Row[]>(sql: string, params?: any[]): Promise<R> {
    const pool = useNitroApp().mysqlPools.get(this.dataSourceName)
    if (!pool) {
      throw new Error(`数据源 ${this.dataSourceName} 未配置`)
    }
    logger.info(sql)
    const [rows] = await pool.query(sql, params)
    return rows as R
  }
}
