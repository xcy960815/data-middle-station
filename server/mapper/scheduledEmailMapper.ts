import { ResultSetHeader } from 'mysql2'
import { batchFormatSqlKey, batchFormatSqlSet, convertToSqlProperties } from '../utils/databaseHelpper'
import { BaseMapper, Column, entityColumnsMap, IColumnTarget, Mapping, mapToTarget, Row } from './baseMapper'

/**
 * @desc 定时邮件任务基础字段
 */
const SCHEDULED_EMAIL_TASK_BASE_FIELDS = [
  'id',
  'task_name',
  'schedule_time',
  'email_config',
  'chart_data',
  'status',
  'remark',
  'created_at',
  'updated_at',
  'executed_at',
  'error_message',
  'retry_count',
  'max_retries'
]

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
  'created_at'
]

/**
 * @desc 定时邮件任务表名
 */
const SCHEDULED_EMAIL_TASK_TABLE_NAME = 'scheduled_email_tasks'

/**
 * @desc 执行日志表名
 */
const SCHEDULED_EMAIL_LOG_TABLE_NAME = 'scheduled_email_logs'

/**
 * @desc 数据源名称
 */
const DATA_SOURCE_NAME = 'data_middle_station'

/**
 * @desc 定时邮件任务选项
 */
export class ScheduledEmailTaskMapping implements ScheduledEmailDao.ScheduledEmailOptions, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('task_name')
  taskName!: string

  @Column('schedule_time')
  scheduleTime!: string

  @Column('email_config')
  emailConfig!: string

  @Column('chart_data')
  chartData!: string

  @Column('status')
  status!: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

  @Column('remark')
  remark?: string

  @Column('created_at')
  createdAt!: string

  @Column('updated_at')
  updatedAt!: string

  @Column('executed_at')
  executedAt?: string

  @Column('error_message')
  errorMessage?: string

  @Column('retry_count')
  retryCount!: number

  @Column('max_retries')
  maxRetries!: number
}

/**
 * @desc 执行日志选项
 */
export class ScheduledEmailLogMapping implements ScheduledEmailDao.ExecutionLogOption, IColumnTarget {
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

  @Column('created_at')
  createdAt!: string
}

export class ScheduledEmailMapper extends BaseMapper {
  /**
   * @desc 数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 创建定时邮件任务
   * @param {ScheduledEmailDao.ScheduledEmailOptions} task  定时邮件任务选项
   * @returns {Promise<number>} 任务ID
   */
  public async createScheduledEmailTask(task: ScheduledEmailDao.ScheduledEmailOptions): Promise<number> {
    const { keys, values } = convertToSqlProperties(task)
    // 只使用数据库表中存在的字段
    const validKeys = keys.filter((key) => SCHEDULED_EMAIL_TASK_BASE_FIELDS.includes(key))
    const validValues = validKeys.map((key) => values[keys.indexOf(key)])
    const sql = `insert into ${SCHEDULED_EMAIL_TASK_TABLE_NAME} (${batchFormatSqlKey(validKeys)}) values (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, validValues)
    return result.insertId || 0
  }

  /**
   * @desc 获取定时邮件任务
   * @param {number} id  任务ID
   * @returns {Promise<ScheduledEmailDao.ScheduledEmailOptions>} 定时邮件任务
   */
  @Mapping(ScheduledEmailTaskMapping)
  public async getScheduledEmailTaskById<
    T extends ScheduledEmailDao.ScheduledEmailOptions = ScheduledEmailDao.ScheduledEmailOptions
  >(id: number): Promise<T> {
    const sql = `select
          ${batchFormatSqlKey(SCHEDULED_EMAIL_TASK_BASE_FIELDS)}
            from ${SCHEDULED_EMAIL_TASK_TABLE_NAME}
          where id = ?`
    const result = await this.exe<Array<T>>(sql, [id])

    return result?.[0]
  }

  /**
   * @desc 更新定时邮件任务
   * @param {ScheduledEmailDao.ScheduledEmailOptions} task  定时邮件任务选项
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateScheduledEmailTask(task: ScheduledEmailDao.ScheduledEmailOptions): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(task)
    const sql = `UPDATE ${SCHEDULED_EMAIL_TASK_TABLE_NAME} set ${batchFormatSqlSet(keys)} where id = ?`
    return (await this.exe<number>(sql, [...values, task.id])) > 0
  }

  /**
   * @desc 删除定时邮件任务(物理删除)
   * @param {number} deleteParams  删除参数
   * @returns {Promise<boolean>} 是否删除成功
   */
  public async deleteScheduledEmailTask(deleteParams: { id: number }): Promise<boolean> {
    const sql = `delete from ${SCHEDULED_EMAIL_TASK_TABLE_NAME} where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [deleteParams.id])
    return result.affectedRows > 0
  }

  /**
   * @desc 查询任务列表
   * @param {ScheduledEmailDto.ScheduledEmailListQuery} params  查询参数
   * @returns {Promise<ScheduledEmailDao.ScheduledEmailOptions[]>} 任务列表
   */
  @Mapping(ScheduledEmailTaskMapping)
  public async getScheduledEmailList(
    params: ScheduledEmailDto.ScheduledEmailListQuery
  ): Promise<ScheduledEmailDao.ScheduledEmailOptions[]> {
    const whereConditions: string[] = []

    const whereValues: string[] = []

    // 构建查询条件
    if (params.status) {
      whereConditions.push('status = ?')
      whereValues.push(params.status)
    }

    if (params.taskName) {
      whereConditions.push('task_name LIKE ?')
      whereValues.push(`%${params.taskName}%`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_TASK_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_TASK_TABLE_NAME}
      ${whereClause}
      ORDER BY created_at DESC
    `

    return this.exe<ScheduledEmailDao.ScheduledEmailOptions[]>(sql, whereValues)
  }

  /**
   * @desc 获取待执行的任务
   * @param currentTime {string} 当前时间
   * @returns {Promise<ScheduledEmailDao.ScheduledEmailOptions[]>} 待执行任务列表
   */
  @Mapping(ScheduledEmailTaskMapping)
  public async getPendingTasks(currentTime: string): Promise<ScheduledEmailDao.ScheduledEmailOptions[]> {
    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_TASK_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_TASK_TABLE_NAME}
      WHERE status = 'pending'
        AND schedule_time <= ?
      ORDER BY schedule_time ASC
    `
    return this.exe<ScheduledEmailDao.ScheduledEmailOptions[]>(sql, [currentTime])
  }

  /**
   * @desc 获取精确时间范围内的任务
   * @param startTime {string} 开始时间
   * @param endTime {string} 结束时间
   * @returns {Promise<ScheduledEmailDao.ScheduledEmailOptions[]>} 任务列表
   */
  @Mapping(ScheduledEmailTaskMapping)
  public async getExactTimeTasks(
    startTime: string,
    endTime: string
  ): Promise<ScheduledEmailDao.ScheduledEmailOptions[]> {
    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_TASK_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_TASK_TABLE_NAME}
      WHERE status = 'pending'
        AND schedule_time > ?
        AND schedule_time <= ?
      ORDER BY schedule_time ASC
    `
    return this.exe<ScheduledEmailDao.ScheduledEmailOptions[]>(sql, [startTime, endTime])
  }

  /**
   * @desc 获取需要重试的失败任务
   * @returns {Promise<ScheduledEmailDao.ScheduledEmailOptions[]>} 可重试任务列表
   */
  @Mapping(ScheduledEmailTaskMapping)
  public async getRetryableTasks(): Promise<ScheduledEmailDao.ScheduledEmailOptions[]> {
    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_TASK_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_TASK_TABLE_NAME}
      WHERE status = 'failed'
        AND retry_count < max_retries
      ORDER BY schedule_time ASC
    `
    return this.exe<ScheduledEmailDao.ScheduledEmailOptions[]>(sql)
  }

  /**
   * @desc 创建执行日志
   * @param {ScheduledEmailDao.ExecutionLogOption} log  执行日志选项
   * @returns {Promise<number>} 日志ID
   */
  public async createScheduledEmailLog(log: ScheduledEmailDao.ExecutionLogOption): Promise<number> {
    const { keys, values } = convertToSqlProperties(log)
    // 只使用数据库表中存在的字段
    const validKeys = keys.filter((key) => SCHEDULED_EMAIL_LOG_BASE_FIELDS.includes(key))
    const validValues = validKeys.map((key) => values[keys.indexOf(key)])
    const sql = `insert into ${SCHEDULED_EMAIL_LOG_TABLE_NAME} (${batchFormatSqlKey(validKeys)}) values (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, validValues)
    return result.insertId || 0
  }

  /**
   * @desc 获取任务执行日志
   * @param {number} taskId  任务ID
   * @param limit {number} 限制数量
   * @returns {Promise<ScheduledEmailDao.ExecutionLogOption[]>} 执行日志列表
   */
  @Mapping(ScheduledEmailLogMapping)
  public async getScheduledEmailLogList(
    taskId: number,
    limit: number = 20
  ): Promise<ScheduledEmailDao.ExecutionLogOption[]> {
    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_LOG_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      WHERE task_id = ?
      ORDER BY execution_time DESC
      LIMIT ?
    `
    return this.exe<ScheduledEmailDao.ExecutionLogOption[]>(sql, [taskId, limit])
  }

  /**
   * @desc 获取定时邮件任务统计信息
   * @returns {Promise<any>} 统计信息
   */
  public async getScheduledEmailTaskStatistics(): Promise<any> {
    const sql = `
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tasks,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_tasks,
        SUM(CASE WHEN YEARWEEK(created_at) = YEARWEEK(CURDATE()) THEN 1 ELSE 0 END) as this_week_tasks,
        SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END) as this_month_tasks
      FROM ${SCHEDULED_EMAIL_TASK_TABLE_NAME}
    `

    const result = await this.exe<any[]>(sql)
    return {
      totalTasks: result[0].total_tasks || 0,
      pendingTasks: result[0].pending_tasks || 0,
      runningTasks: result[0].running_tasks || 0,
      completedTasks: result[0].completed_tasks || 0,
      failedTasks: result[0].failed_tasks || 0,
      cancelledTasks: result[0].cancelled_tasks || 0,
      todayTasks: result[0].today_tasks || 0,
      thisWeekTasks: result[0].this_week_tasks || 0,
      thisMonthTasks: result[0].this_month_tasks || 0
    }
  }
}
