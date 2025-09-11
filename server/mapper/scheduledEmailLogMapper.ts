import { ResultSetHeader } from 'mysql2'
import { batchFormatSqlKey, convertToSqlProperties } from '../utils/databaseHelpper'
import { BaseMapper, Column, entityColumnsMap, IColumnTarget, Mapping, mapToTarget, Row } from './baseMapper'

/**
 * @desc 执行日志基础字段
 */
const SCHEDULED_EMAIL_LOG_BASE_FIELDS = [
  'id',
  'task_id',
  'execution_time',
  'status',
  'message',
  'error_details',
  'email_message_id',
  'execution_duration',
  'created_time',
  'created_by'
]

/**
 * @desc 执行日志表名
 */
const SCHEDULED_EMAIL_LOG_TABLE_NAME = 'scheduled_email_logs'

/**
 * @desc 数据源名称
 */
const DATA_SOURCE_NAME = 'data_middle_station'

/**
 * @desc 执行日志选项映射
 */
export class ScheduledEmailLogMapping implements ScheduledEmailLogDao.ExecutionLogOption, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('task_id')
  taskId!: number

  @Column('execution_time')
  executionTime!: string

  @Column('status')
  status!: 'success' | 'failed'

  @Column('message')
  message?: string

  @Column('error_details')
  errorDetails?: string

  @Column('email_message_id')
  emailMessageId?: string

  @Column('execution_duration')
  executionDuration?: number

  @Column('created_time')
  createdTime!: string

  @Column('created_by')
  createdBy!: string
}

/**
 * @desc 定时邮件日志Mapper
 */
export class ScheduledEmailLogMapper extends BaseMapper {
  /**
   * @desc 数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 创建执行日志
   * @param {ScheduledEmailLogDao.ExecutionLogOption} log  执行日志选项
   * @returns {Promise<number>} 日志ID
   */
  public async createScheduledEmailLog(log: ScheduledEmailLogDao.ExecutionLogOption): Promise<number> {
    const { keys, values } = convertToSqlProperties(log)
    // 只使用数据库表中存在的字段
    const validKeys = keys.filter((key) => SCHEDULED_EMAIL_LOG_BASE_FIELDS.includes(key))
    const validValues = validKeys.map((key) => values[keys.indexOf(key)])
    const sql = `INSERT INTO ${SCHEDULED_EMAIL_LOG_TABLE_NAME} (${batchFormatSqlKey(validKeys)}) VALUES (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, validValues)
    return result.insertId || 0
  }

  /**
   * @desc 根据ID获取执行日志
   * @param {number} id  日志ID
   * @returns {Promise<ScheduledEmailLogDao.ExecutionLogOption | null>} 执行日志
   */
  @Mapping(ScheduledEmailLogMapping)
  public async getScheduledEmailLogById(id: number): Promise<ScheduledEmailLogDao.ExecutionLogOption | null> {
    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_LOG_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      WHERE id = ?
    `
    const result = await this.exe<ScheduledEmailLogDao.ExecutionLogOption[]>(sql, [id])
    return result?.[0] || null
  }

  /**
   * @desc 获取任务执行日志列表
   * @param {ScheduledEmailLogDao.LogListQuery} query  查询参数
   * @returns {Promise<ScheduledEmailLogDao.ExecutionLogOption[]>} 执行日志列表
   */
  @Mapping(ScheduledEmailLogMapping)
  public async getScheduledEmailLogList(
    query: ScheduledEmailLogDao.LogListQuery
  ): Promise<ScheduledEmailLogDao.ExecutionLogOption[]> {
    const whereConditions: string[] = []
    const whereValues: any[] = []

    // 构建查询条件
    if (query.taskId) {
      whereConditions.push('task_id = ?')
      whereValues.push(query.taskId)
    }

    if (query.status) {
      whereConditions.push('status = ?')
      whereValues.push(query.status)
    }

    if (query.startTime) {
      whereConditions.push('execution_time >= ?')
      whereValues.push(query.startTime)
    }

    if (query.endTime) {
      whereConditions.push('execution_time <= ?')
      whereValues.push(query.endTime)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const limit = query.limit || 50
    const offset = query.offset || 0

    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_LOG_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      ${whereClause}
      ORDER BY execution_time DESC
      LIMIT ? OFFSET ?
    `

    return this.exe<ScheduledEmailLogDao.ExecutionLogOption[]>(sql, [...whereValues, limit, offset])
  }

  /**
   * @desc 获取任务执行日志总数
   * @param {ScheduledEmailLogDao.LogListQuery} query  查询参数
   * @returns {Promise<number>} 总数
   */
  public async getScheduledEmailLogCount(query: ScheduledEmailLogDao.LogListQuery): Promise<number> {
    const whereConditions: string[] = []
    const whereValues: any[] = []

    // 构建查询条件
    if (query.taskId) {
      whereConditions.push('task_id = ?')
      whereValues.push(query.taskId)
    }

    if (query.status) {
      whereConditions.push('status = ?')
      whereValues.push(query.status)
    }

    if (query.startTime) {
      whereConditions.push('execution_time >= ?')
      whereValues.push(query.startTime)
    }

    if (query.endTime) {
      whereConditions.push('execution_time <= ?')
      whereValues.push(query.endTime)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const sql = `
      SELECT COUNT(*) as total
      FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      ${whereClause}
    `

    const result = await this.exe<Array<{ total: number }>>(sql, whereValues)
    return result[0]?.total || 0
  }

  /**
   * @desc 根据任务ID获取最新的执行日志
   * @param {number} taskId  任务ID
   * @returns {Promise<ScheduledEmailLogDao.ExecutionLogOption | null>} 最新执行日志
   */
  @Mapping(ScheduledEmailLogMapping)
  public async getLatestLogByTaskId(taskId: number): Promise<ScheduledEmailLogDao.ExecutionLogOption | null> {
    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_LOG_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      WHERE task_id = ?
      ORDER BY execution_time DESC
      LIMIT 1
    `
    const result = await this.exe<ScheduledEmailLogDao.ExecutionLogOption[]>(sql, [taskId])
    return result?.[0] || null
  }

  /**
   * @desc 删除任务相关的所有日志
   * @param {number} taskId  任务ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  public async deleteLogsByTaskId(taskId: number): Promise<boolean> {
    const sql = `DELETE FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME} WHERE task_id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [taskId])
    return result.affectedRows > 0
  }

  /**
   * @desc 获取日志统计信息
   * @param {number} taskId  任务ID(可选)
   * @returns {Promise<ScheduledEmailLogDao.LogStatistics>} 统计信息
   */
  public async getLogStatistics(taskId?: number): Promise<ScheduledEmailLogDao.LogStatistics> {
    const whereClause = taskId ? 'WHERE task_id = ?' : ''
    const params = taskId ? [taskId] : []

    const sql = `
      SELECT
        COUNT(*) as total_logs,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN DATE(execution_time) = CURDATE() THEN 1 ELSE 0 END) as today_count,
        SUM(CASE WHEN YEARWEEK(execution_time) = YEARWEEK(CURDATE()) THEN 1 ELSE 0 END) as this_week_count,
        SUM(CASE WHEN YEAR(execution_time) = YEAR(CURDATE()) AND MONTH(execution_time) = MONTH(CURDATE()) THEN 1 ELSE 0 END) as this_month_count,
        COALESCE(AVG(execution_duration), 0) as avg_duration
      FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      ${whereClause}
    `

    const result = await this.exe<any[]>(sql, params)
    const stats = result[0]

    return {
      totalLogs: stats.total_logs || 0,
      successCount: stats.success_count || 0,
      failedCount: stats.failed_count || 0,
      todayCount: stats.today_count || 0,
      thisWeekCount: stats.this_week_count || 0,
      thisMonthCount: stats.this_month_count || 0,
      avgDuration: Math.round(stats.avg_duration || 0)
    }
  }

  /**
   * @desc 清理过期日志(保留最近30天)
   * @returns {Promise<number>} 清理的日志数量
   */
  public async cleanupExpiredLogs(): Promise<number> {
    const sql = `
      DELETE FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      WHERE execution_time < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `
    const result = await this.exe<ResultSetHeader>(sql)
    return result.affectedRows || 0
  }

  /**
   * @desc 获取任务的执行成功率统计
   * @param {number} taskId  任务ID
   * @param {number} days  统计天数(默认30天)
   * @returns {Promise<Array<{date: string, successRate: number}>>} 成功率统计
   */
  public async getTaskSuccessRateStats(
    taskId: number,
    days: number = 30
  ): Promise<Array<{ date: string; successRate: number; totalCount: number; successCount: number }>> {
    const sql = `
      SELECT
        DATE(execution_time) as date,
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        ROUND(
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
          2
        ) as success_rate
      FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      WHERE task_id = ?
        AND execution_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(execution_time)
      ORDER BY date DESC
    `

    const result = await this.exe<
      Array<{
        date: string
        total_count: number
        success_count: number
        success_rate: number
      }>
    >(sql, [taskId, days])

    return result.map((row) => ({
      date: row.date,
      successRate: row.success_rate || 0,
      totalCount: row.total_count,
      successCount: row.success_count
    }))
  }
}
