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
  'task_type',
  'recurring_days',
  'recurring_time',
  'is_active',
  'next_execution_time',
  'email_config',
  'analyse_options',
  'status',
  'remark',
  'created_by',
  'updated_by',
  'created_time',
  'updated_time',
  'executed_time',
  'error_message',
  'retry_count',
  'max_retries'
]

/**
 * @desc 定时邮件任务表名
 */
const SCHEDULED_EMAIL_TASK_TABLE_NAME = 'scheduled_email_tasks'

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
  scheduleTime?: string | null

  @Column('task_type')
  taskType!: ScheduledEmailDao.TaskType

  @Column('recurring_days')
  recurringDays?: number[] | null

  @Column('recurring_time')
  recurringTime?: string | null

  @Column('is_active')
  isActive!: boolean

  @Column('next_execution_time')
  nextExecutionTime?: string | null

  @Column('email_config')
  emailConfig!: ScheduledEmailDao.EmailConfig

  @Column('analyse_options')
  analyseOptions!: ScheduledEmailDao.AnalyseOptions

  @Column('status')
  status!: ScheduledEmailDao.Status

  @Column('remark')
  remark?: string

  @Column('created_time')
  createdTime!: string

  @Column('updated_time')
  updatedTime!: string

  @Column('executed_time')
  executedTime?: string

  @Column('error_message')
  errorMessage?: string

  @Column('retry_count')
  retryCount!: number

  @Column('max_retries')
  maxRetries!: number

  @Column('created_by')
  createdBy!: string

  @Column('updated_by')
  updatedBy!: string
}

export class ScheduledEmailMapper extends BaseMapper {
  /**
   * @desc 数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 创建定时邮件任务
   * @param {ScheduledEmailDao.CreateScheduledEmailOptions} scheduledEmailOptions  定时邮件任务选项
   * @returns {Promise<number>} 任务ID
   */
  public async createScheduledEmailTask(
    scheduledEmailOptions: ScheduledEmailDao.CreateScheduledEmailOptions
  ): Promise<number> {
    const { keys, values } = convertToSqlProperties(scheduledEmailOptions)
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
   * @param {ScheduledEmailDao.UpdateScheduledEmailOptions} scheduledEmailOptions  定时邮件任务选项
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateScheduledEmailTask(
    scheduledEmailOptions: ScheduledEmailDao.UpdateScheduledEmailOptions
  ): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(scheduledEmailOptions)
    const sql = `UPDATE ${SCHEDULED_EMAIL_TASK_TABLE_NAME} set ${batchFormatSqlSet(keys)} where id = ?`
    return (await this.exe<number>(sql, [...values, scheduledEmailOptions.id])) > 0
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
      ORDER BY created_time DESC
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
}
