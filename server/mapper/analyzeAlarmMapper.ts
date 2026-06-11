import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import {
  convertToSqlProperties,
  batchFormatSqlKey,
  batchFormatSqlSet,
  formatSqlKey
} from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

class AnalyzeAlarmMapping implements AnalyzeAlarmDao.AnalyzeAlarmRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('analyze_id')
  analyzeId!: number

  @Column('alarm_name')
  alarmName!: string

  @Column('is_active')
  isActive!: number

  @Column('cron_expression')
  cronExpression!: string

  @Column('conditions')
  conditions: AnalyzeAlarmDao.AlarmCondition[] = []

  @Column('notification_config')
  notificationConfig!: AnalyzeAlarmDao.NotificationConfig

  @Column('alarm_strategy')
  alarmStrategy!: AnalyzeAlarmDao.AlarmStrategy

  @Column('last_triggered_time')
  lastTriggeredTime!: string | null

  @Column('created_by')
  createdBy!: string

  @Column('updated_by')
  updatedBy!: string

  @Column('created_time')
  createTime!: string

  @Column('updated_time')
  updateTime!: string
}

class AnalyzeAlarmLogMapping implements AnalyzeAlarmDao.AnalyzeAlarmLogRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('alarm_id')
  alarmId!: number

  @Column('execute_time')
  executeTime!: string

  @Column('is_triggered')
  isTriggered!: number

  @Column('trigger_detail')
  triggerDetail!: any

  @Column('notify_status')
  notifyStatus!: string

  @Column('error_message')
  errorMessage!: string
}

const ANALYZE_ALARM_TABLE_NAME = 'analyze_alarms'
const ANALYZE_ALARM_LOGS_TABLE_NAME = 'analyze_alarm_logs'
const DATA_SOURCE_NAME = 'data_middle_station'

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

const ANALYZE_ALARM_LOGS_FIELDS = [
  'id',
  'alarm_id',
  'execute_time',
  'is_triggered',
  'trigger_detail',
  'notify_status',
  'error_message'
]

export class AnalyzeAlarmMapper extends BaseMapper {
  public dataSourceName = DATA_SOURCE_NAME

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

  @Mapping(AnalyzeAlarmMapping)
  public async getAnalyzeAlarmById(id: number): Promise<AnalyzeAlarmDao.AnalyzeAlarmRecord | null> {
    const sql = `
      select ${batchFormatSqlKey(ANALYZE_ALARM_FIELDS)}
      from ${ANALYZE_ALARM_TABLE_NAME}
      where id = ?`
    const result = await this.exe<AnalyzeAlarmDao.AnalyzeAlarmRecord[]>(sql, [id])
    return result?.[0] || null
  }

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

  public async deleteAnalyzeAlarm(id: number): Promise<boolean> {
    const sql = `delete from ${ANALYZE_ALARM_TABLE_NAME} where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [id])
    return result.affectedRows > 0
  }

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
