
import mysql from 'mysql2/promise';
import { getProcessEnvProperties } from '~/utils/utils.server';

// declare type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
// declare type PropertyDecorator = (target: Object, propertyKey: string | symbol) => void;
// declare type MethodDecorator = <T>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;
// declare type ParameterDecorator = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;


/* 初始化logger */
const logger = new Logger({ fileName: 'database', folderName: 'database' });
/**
 * @desc ts 装饰器
 * @link  https://www.cnblogs.com/winfred/p/8216650.html
 */
/**
 * @desc 数据源配置
 * @param dataSourceName { keyof DataSourceConfig}
 * @returns  {ClassDecorator}
 */
export function BindDataSource(dataSourceName: keyof NodeJS.DataSourceConfig): ClassDecorator {
  return function (target) {
    target.prototype.dataSourceName = dataSourceName;
    return target;
  };
}

type Row = Record<string, any>;

type ColumnMapper = (data: Array<Row> | Row) => Array<Row> | Row;

function mapToTarget(
  target: Object & { columnsMap?: Map<string, string>; columnsMapper?: ColumnMapper },
  data: Array<Row> | Row,
  columnsMap?: Map<string, string>,
): Array<Row> | Row {
  const mapRowToTarget = (row: Row): Map<string, any> => {
    // TODO 好恶心啊 明明进来的是一个class 类  但是要执行 new target.constructor() 才能拿到实例
    const instance = new (target as any).constructor();
    columnsMap?.forEach((mapValue, mapKey) => {
      let instanceProperty = instance[mapValue];

      if (typeof instanceProperty === 'function') {
        instance[mapValue] = instanceProperty.call(instance, row[mapKey]);
      } else {
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(instance),
          mapValue,
        );
        instanceProperty = descriptor?.set;

        if (instanceProperty) {
          instanceProperty.call(instance, row[mapKey]);
        } else {
          instance[mapValue] = row[mapKey];
        }
      }
    });

    return instance;
  };

  if (!data) return data;

  return Array.isArray(data) ? data.map((row) => mapRowToTarget(row)) : mapRowToTarget(data);
}
/**
 * @desc 映射 数据库字段到实体类属性
 * @param columnName {string}
 * @returns {PropertyDecorator}
 */
export function Column(columnName: string): PropertyDecorator {
  return function (
    target: Object & { columnsMap?: Map<string, string>; columnsMapper?: ColumnMapper },
    propertyKey: string | symbol,
  ) {
    const columnsMap = target['columnsMap'] || new Map();
    columnsMap.set(columnName, propertyKey);
    if (!target['columnsMap']) {
      target['columnsMap'] = columnsMap;
      target['columnsMapper'] = (data) => mapToTarget(target, data, columnsMap);
    }
  };
}
/**
 * @description 执行 映射 业务查询结果到实体类
 * @param mapping {Function}
 * @returns {MethodDecorator}
 */
export function Mapping(mapping: { new (): Object }): MethodDecorator {
  return function (
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function () {
      const originValue = await originalMethod.apply(this, arguments);
      if (mapping) {
        return mapping.prototype['columnsMapper'](originValue);
      } else {
        return originValue;
      }
    };
    return descriptor;
  };
}
/**
 * @desc 数据库操作基类
 */
export class DOBase {
  // 线程池
  private poolMap: Map<string, mysql.Pool> = new Map();
  // 查找线程池
  private getPool(dataSourceName: string): mysql.Pool {
    if (!this.poolMap) {
      this.poolMap = new Map();
    }
    let pool = this.poolMap.get(dataSourceName);
    if (!pool) {
      const dataSourceConfig = getProcessEnvProperties('dataSourceConfig');
      const currentDataSourceConfig: mysql.PoolOptions =
        JSON.parse(dataSourceConfig)[dataSourceName];
      // 创建连接池
      pool = mysql.createPool(currentDataSourceConfig);
      this.poolMap.set(dataSourceName, pool);
    }
    return pool;
  }
  /**
   * @desc 执行sql
   * @param sql {string}
   * @param params {Array<any>}
   * @returns  {Promise<T>}
   */
  protected async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    const dataSourceName = Object.getPrototypeOf(this).dataSourceName;

    //  查找线程池
    const pool = this.getPool(dataSourceName);
    // 获取连接
    const sqlContainer = await pool.getConnection();
    const startTime = Date.now();
    const queryResult = await sqlContainer
      .query(sql, params)
      .then(([rows]) => {
        const duration = Date.now() - startTime;
        // console.log(
        //   chalk.green('业务查询sql'),
        //   sql,
        //   chalk.blue('请求参数'),
        //   params ? params : '无',
        //   chalk.yellow('耗时'),
        //   duration,
        //   'ms',
        // );
        logger.info(`${sql} 请求参数 ${params ? params : '无'} 耗时 ${duration} ms`);

        return rows;
      })
      .catch((error) => {
        // console.log('error---error', chalk.redBright(error.message));
        logger.error(`${sql} 请求参数 ${params} error ${error}`);
        throw error;
      })
      .finally(() => {
        sqlContainer && sqlContainer.release();
      });

    return queryResult as T;
  }
}
