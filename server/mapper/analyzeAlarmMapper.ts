import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import {
  convertToSqlProperties,
  batchFormatSqlKey,
  batchFormatSqlSet,
  formatSqlKey
} from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

/**
 * 看板告警策略映射实体类，用于将告警主表行数据映射为告警配置对象。
 * @implements {AnalyzeAlarmDao.AnalyzeAlarmRecord}
 * @implements {IColumnTarget}
 */
class AnalyzeAlarmMapping implements AnalyzeAlarmDao.AnalyzeAlarmRecord, IColumnTarget {
  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 告警策略 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 关联的看板分析 ID
   * @type {number}
   */
  @Column('analyze_id')
  analyzeId!: number

  /**
   * 告警名称
   * @type {string}
   */
  @Column('alarm_name')
  alarmName!: string

  /**
   * 告警是否启用（1启用，0禁用）
   * @type {number}
   */
  @Column('is_active')
  isActive!: number

  /**
   * 定时调度的 Cron 表达式
   * @type {string}
   */
  @Column('cron_expression')
  cronExpression!: string

  /**
   * 触发阈值条件列表
   * @type {AnalyzeAlarmDao.AlarmCondition[]}
   */
  @Column('conditions')
  conditions: AnalyzeAlarmDao.AlarmCondition[] = []

  /**
   * 告警通知渠道和接收人配置
   * @type {AnalyzeAlarmDao.NotificationConfig}
   */
  @Column('notification_config')
  notificationConfig!: AnalyzeAlarmDao.NotificationConfig

  /**
   * 告警级别与恢复策略等
   * @type {AnalyzeAlarmDao.AlarmStrategy}
   */
  @Column('alarm_strategy')
  alarmStrategy!: AnalyzeAlarmDao.AlarmStrategy

  /**
   * 最近一次成功触发并发送告警的时间
   * @type {string | null}
   */
  @Column('last_triggered_time')
  lastTriggeredTime!: string | null

  /**
   * 创建人
   * @type {string}
   */
  @Column('created_by')
  createdBy!: string

  /**
   * 更新人
   * @type {string}
   */
  @Column('updated_by')
  updatedBy!: string

  /**
   * 创建时间
   * @type {string}
   */
  @Column('created_time')
  createTime!: string

  /**
   * 更新时间
   * @type {string}
   */
  @Column('updated_time')
  updateTime!: string
}

/**
 * 告警运行日志实体映射类，用于将告警运行日志表行数据映射为日志记录对象。
 * @implements {AnalyzeAlarmDao.AnalyzeAlarmLogRecord}
 * @implements {IColumnTarget}
 */
class AnalyzeAlarmLogMapping implements AnalyzeAlarmDao.AnalyzeAlarmLogRecord, IColumnTarget {
  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 日志 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 关联的告警策略 ID
   * @type {number}
   */
  @Column('alarm_id')
  alarmId!: number

  /**
   * 日志记录的执行时间
   * @type {string}
   */
  @Column('execute_time')
  executeTime!: string

  /**
   * 是否触发了告警（1触发，0未触发）
   * @type {number}
   */
  @Column('is_triggered')
  isTriggered!: number

  /**
   * 触发时的详细数据包（通常是触发告警时的具体字段值）
   * @type {*}
   */
  @Column('trigger_detail')
  triggerDetail!: any

  /**
   * 通知发送状态
   * @type {string}
   */
  @Column('notify_status')
  notifyStatus!: string

  /**
   * 执行报错时的错误堆栈/信息
   * @type {string}
   */
  @Column('error_message')
  errorMessage!: string
}

/**
 * 告警配置表的表名
 * @type {string}
 */
const ANALYZE_ALARM_TABLE_NAME = 'analyze_alarms'

/**
 * 告警执行日志表的表名
 * @type {string}
 */
const ANALYZE_ALARM_LOGS_TABLE_NAME = 'analyze_alarm_logs'

/**
 * 默认使用的数据库连接池名称
 * @type {string}
 */
const DATA_SOURCE_NAME = 'data_middle_station'

/**
 * 告警配置表的所有字段列表
 * @type {string[]}
 */
const ANALYZE_ALARM_FIELDS = [
  'id',
  'analyze_id',
  'alarm_name',
  'is_active',
  'cron_expression',
  'conditions',
  'notification_config',
  'alarm_strategy',
  'last_triggered_time',
  'created_by',
  'updated_by',
  'created_time',
  'updated_time'
]

/**
 * 告警日志表的所有字段列表
 * @type {string[]}
 */
const ANALYZE_ALARM_LOGS_FIELDS = [
  'id',
  'alarm_id',
  'execute_time',
  'is_triggered',
  'trigger_detail',
  'notify_status',
  'error_message'
]

/**
 * 看板告警策略及日志 Mapper 类，提供告警的配置、更新、日志记录查询等。
 * @extends {BaseMapper}
 */
export class AnalyzeAlarmMapper extends BaseMapper {
  /**
   * 当前 mapper 使用的数据源名称
   * @type {string}
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * 获取分析下的告警策略列表
   * @param {AnalyzeAlarmDao.GetAnalyzeAlarmParams} params 获取参数
   * @returns {Promise<AnalyzeAlarmDao.AnalyzeAlarmRecord[]>} 告警策略记录数组
   */
  @Mapping(AnalyzeAlarmMapping)
  public async getAnalyzeAlarms(
    params: AnalyzeAlarmDao.GetAnalyzeAlarmParams
  ): Promise<AnalyzeAlarmDao.AnalyzeAlarmRecord[]> {
    const { keys, values } = convertToSqlProperties(params)
    const whereClauses: string[] = []
    const queryValues: any[] = []

    keys.forEach((key, index) => {
      if (ANALYZE_ALARM_FIELDS.includes(key)) {
        whereClauses.push(`${formatSqlKey(key)} = ?`)
        queryValues.push(values[index])
      }
    })

    const whereSql = whereClauses.length > 0 ? `where ${whereClauses.join(' and ')}` : ''
    const sql = `
      select ${batchFormatSqlKey(ANALYZE_ALARM_FIELDS)}
      from ${ANALYZE_ALARM_TABLE_NAME}
      ${whereSql}
      order by id desc`
    return await this.exe<AnalyzeAlarmDao.AnalyzeAlarmRecord[]>(sql, queryValues)
  }

  /**
   * 根据 ID 获取单个告警配置记录
   * @param {number} id 告警记录 ID
   * @returns {Promise<AnalyzeAlarmDao.AnalyzeAlarmRecord | null>} 告警配置记录，不存在时返回 null
   */
  @Mapping(AnalyzeAlarmMapping)
  public async getAnalyzeAlarmById(id: number): Promise<AnalyzeAlarmDao.AnalyzeAlarmRecord | null> {
    const sql = `
      select ${batchFormatSqlKey(ANALYZE_ALARM_FIELDS)}
      from ${ANALYZE_ALARM_TABLE_NAME}
      where id = ?`
    const result = await this.exe<AnalyzeAlarmDao.AnalyzeAlarmRecord[]>(sql, [id])
    return result?.[0] || null
  }

  /**
   * 创建新的告警策略
   * @param {AnalyzeAlarmDao.CreateAnalyzeAlarmParams} params 创建参数
   * @returns {Promise<number>} 新创建的告警配置 ID
   */
  public async createAnalyzeAlarm(params: AnalyzeAlarmDao.CreateAnalyzeAlarmParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(params)
    const validKeys = keys.filter((key) => ANALYZE_ALARM_FIELDS.includes(key))
    const validValues = validKeys.map((key) => values[keys.indexOf(key)])
    const sql = `
      insert into ${ANALYZE_ALARM_TABLE_NAME}
        (${batchFormatSqlKey(validKeys)})
      values (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, validValues)
    return result.insertId || 0
  }

  /**
   * 更新已有的告警策略配置
   * @param {AnalyzeAlarmDao.UpdateAnalyzeAlarmParams} params 更新参数（必须包含 id）
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateAnalyzeAlarm(params: AnalyzeAlarmDao.UpdateAnalyzeAlarmParams): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(params)
    const validKeys = keys.filter((key) => ANALYZE_ALARM_FIELDS.includes(key) && key !== 'id')
    const validValues = validKeys.map((key) => values[keys.indexOf(key)])

    if (validKeys.length === 0) return false

    const setClauses = batchFormatSqlSet(validKeys)
    const sql = `
      update ${ANALYZE_ALARM_TABLE_NAME}
      set ${setClauses}
      where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [...validValues, params.id])
    return result.affectedRows > 0
  }

  /**
   * 删除指定的告警配置记录（物理删除）
   * @param {number} id 告警 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  public async deleteAnalyzeAlarm(id: number): Promise<boolean> {
    const sql = `delete from ${ANALYZE_ALARM_TABLE_NAME} where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [id])
    return result.affectedRows > 0
  }

  /**
   * 查询指定告警策略的历史执行日志列表（按执行时间倒序，最多返回最近的 100 条）
   * @param {number} alarmId 告警配置 ID
   * @returns {Promise<AnalyzeAlarmDao.AnalyzeAlarmLogRecord[]>} 告警运行日志记录数组
   */
  @Mapping(AnalyzeAlarmLogMapping)
  public async getAnalyzeAlarmLogs(alarmId: number): Promise<AnalyzeAlarmDao.AnalyzeAlarmLogRecord[]> {
    const sql = `
      select ${batchFormatSqlKey(ANALYZE_ALARM_LOGS_FIELDS)}
      from ${ANALYZE_ALARM_LOGS_TABLE_NAME}
      where alarm_id = ?
      order by execute_time desc
      limit 100`
    return await this.exe<AnalyzeAlarmDao.AnalyzeAlarmLogRecord[]>(sql, [alarmId])
  }

  /**
   * 记录单次告警执行运行日志
   * @param {AnalyzeAlarmDao.CreateAnalyzeAlarmLogParams} params 告警运行日志参数
   * @returns {Promise<number>} 新创建的日志记录 ID
   */
  public async createAnalyzeAlarmLog(params: AnalyzeAlarmDao.CreateAnalyzeAlarmLogParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(params)
    const validKeys = keys.filter((key) => ANALYZE_ALARM_LOGS_FIELDS.includes(key))
    const validValues = validKeys.map((key) => values[keys.indexOf(key)])
    const sql = `
      insert into ${ANALYZE_ALARM_LOGS_TABLE_NAME}
        (${batchFormatSqlKey(validKeys)})
      values (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, validValues)
    return result.insertId || 0
  }
}
