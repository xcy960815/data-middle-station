import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { batchFormatSqlKey, batchFormatSqlSet, convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

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
  'analyze_options',
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
 * @desc 定时邮件任务行数据映射，将数据库字段转换为任务实体
 */
export class ScheduledEmailTaskMapping implements ScheduledEmailDao.ScheduledEmailOptions, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }
  /**
   * id
   */
  @Column('id')
  id!: number

  /**
   * 任务名称
   */
  @Column('task_name')
  taskName!: string

  /**
   * 定时任务执行时间
   * @example 2023-01-01 00:00:00
   */
  @Column('schedule_time')
  scheduleTime?: string | null

  /**
   * 任务类型
   */
  @Column('task_type')
  taskType!: ScheduledEmailDao.TaskType

  /**
   * 定时任务重复执行天数
   */
  @Column('recurring_days')
  recurringDays?: number[] | null

  /**
   * 定时任务重复执行时间
   * @example 00:00:00
   */
  @Column('recurring_time')
  recurringTime?: string | null

  /**
   * 任务是否激活
   */
  @Column('is_active')
  isActive!: boolean

  /**
   * 下次执行时间
   * @example 2023-01-01 00:00:00
   */
  @Column('next_execution_time')
  nextExecutionTime?: string | null

  /**
   * 邮件配置
   */
  @Column('email_config')
  emailConfig!: ScheduledEmailDao.EmailConfig

  /**
   * 分析选项
   */
  @Column('analyze_options')
  analyzeOptions!: ScheduledEmailDao.AnalyzeOptions

  /**
   * 任务状态
   */
  @Column('status')
  status!: ScheduledEmailDao.Status

  /**
   * 备注
   */
  @Column('remark')
  remark?: string

  /**
   * 创建时间
   */
  @Column('created_time')
  createdTime!: string

  /**
   * 更新时间
   */
  @Column('updated_time')
  updatedTime!: string

  /**
   * 执行时间
   */
  @Column('executed_time')
  executedTime?: string

  /**
   * 错误信息
   */
  @Column('error_message')
  errorMessage?: string

  /**
   * 重试次数
   */
  @Column('retry_count')
  retryCount!: number

  /**
   * 最大重试次数
   */
  @Column('max_retries')
  maxRetries!: number

  /**
   * 创建人
   */
  @Column('created_by')
  createdBy!: string

  /**
   * 更新人
   */
  @Column('updated_by')
  updatedBy!: string
}

/**
 * @desc 定时邮件任务 mapper，负责对任务的增删改查及调度相关查询
 */
export class ScheduledEmailMapper extends BaseMapper {
  /**
   * @desc 数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 创建定时邮件任务
   * @param scheduledEmailOptions 创建定时任务所需字段（名称、时间、邮件/分析配置等）
   * @returns 新建任务的主键 ID
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
   * @desc 根据主键 ID 获取单个定时邮件任务
   * @param query 查询参数（至少包含任务 ID，可附带状态、类型、启用状态等条件）
   * @returns 匹配的任务记录（若存在）
   */
  @Mapping(ScheduledEmailTaskMapping)
  public async getScheduledEmailTask<
    T extends ScheduledEmailDao.ScheduledEmailOptions = ScheduledEmailDao.ScheduledEmailOptions
  >(query: ScheduledEmailDao.ScheduledEmailQueryOptions): Promise<T | null> {
    const { whereConditions, whereValues } = this.buildTaskQueryConditions(query)

    if (whereConditions.length === 0) {
      throw new Error('getScheduledEmailTask 至少需要一个查询条件')
    }

    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_TASK_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_TASK_TABLE_NAME}
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY id DESC
      LIMIT 1
    `

    const result = await this.exe<Array<T>>(sql, whereValues)

    return result?.[0] || null
  }

  /**
   * @desc 更新定时邮件任务
   * @param scheduledEmailOptions 更新任务所需字段（包含主键 ID）
   * @returns 是否更新成功
   */
  public async updateScheduledEmailTask(
    scheduledEmailOptions: ScheduledEmailDao.UpdateScheduledEmailOptions
  ): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(scheduledEmailOptions)
    const sql = `UPDATE ${SCHEDULED_EMAIL_TASK_TABLE_NAME} set ${batchFormatSqlSet(keys)} where id = ?`
    return (await this.exe<number>(sql, [...values, scheduledEmailOptions.id])) > 0
  }

  /**
   * @desc 删除定时邮件任务（物理删除）
   * @param deleteParams 删除参数，只需包含任务 ID
   * @returns 是否删除成功
   */
  public async deleteScheduledEmailTask(query: ScheduledEmailDao.DeleteScheduledEmailOptions): Promise<number> {
    const { whereConditions, whereValues } = this.buildTaskQueryConditions(query)

    if (whereConditions.length === 0) {
      throw new Error('deleteScheduledEmailTask 至少需要一个查询条件')
    }

    const sql = `
      DELETE FROM ${SCHEDULED_EMAIL_TASK_TABLE_NAME}
      WHERE ${whereConditions.join(' AND ')}
    `

    const result = await this.exe<ResultSetHeader>(sql, whereValues)
    return result.affectedRows || 0
  }

  /**
   * @desc 查询定时邮件任务列表
   * @param params 查询条件（支持按状态、任务名模糊查询）
   * @returns 匹配的任务列表
   */
  @Mapping(ScheduledEmailTaskMapping)
  public async getScheduledEmailTaskList(
    params: ScheduledEmailDao.ScheduledEmailListOptions
  ): Promise<ScheduledEmailDao.ScheduledEmailOptions[]> {
    const { whereConditions, whereValues } = this.buildTaskQueryConditions(params, { allowEmpty: true })

    if (params.keyword) {
      whereConditions.push('(task_name LIKE ? OR remark LIKE ?)')
      whereValues.push(`%${params.keyword}%`, `%${params.keyword}%`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    const limit = typeof params.limit === 'number' ? params.limit : 100
    const offset = typeof params.offset === 'number' ? params.offset : 0

    const orderByMap: Record<string, string> = {
      created_time: 'created_time',
      schedule_time: 'schedule_time',
      updated_time: 'updated_time'
    }
    const orderByColumn = params.orderBy && orderByMap[params.orderBy] ? orderByMap[params.orderBy] : 'created_time'
    const orderDirection = params.orderDirection === 'asc' ? 'ASC' : 'DESC'

    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_TASK_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_TASK_TABLE_NAME}
      ${whereClause}
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `

    return this.exe<ScheduledEmailDao.ScheduledEmailOptions[]>(sql, [...whereValues, limit, offset])
  }

  /**
   * @desc 获取待执行的任务（单次定时任务）
   * @param currentTime 当前时间，通常为调度触发时间
   * @returns 在当前时间点应被执行的任务列表
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
   * @desc 获取精确时间范围内的待执行任务
   * @param startTime 开始时间（左开区间）
   * @param endTime 结束时间（右闭区间）
   * @returns 时间区间内的任务列表
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
   * @returns 仍处于失败状态且未超过最大重试次数的任务列表
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

  private buildTaskQueryConditions(
    query: ScheduledEmailDao.ScheduledEmailQueryOptions,
    options?: { allowEmpty?: boolean }
  ): {
    whereConditions: string[]
    whereValues: Array<string | number>
  } {
    const whereConditions: string[] = []
    const whereValues: Array<string | number> = []

    const appendNumberCondition = (column: string, value?: number) => {
      if (typeof value === 'number') {
        whereConditions.push(`${column} = ?`)
        whereValues.push(value)
      }
    }

    const appendStringCondition = (column: string, value?: string) => {
      if (typeof value === 'string' && value.trim() !== '') {
        whereConditions.push(`${column} = ?`)
        whereValues.push(value.trim())
      }
    }

    appendNumberCondition('id', query.id)
    appendStringCondition('task_name', query.taskName)

    if (query.status) {
      whereConditions.push('status = ?')
      whereValues.push(query.status)
    }

    if (query.taskType) {
      whereConditions.push('task_type = ?')
      whereValues.push(query.taskType)
    }

    if (typeof query.isActive === 'boolean') {
      whereConditions.push('is_active = ?')
      whereValues.push(query.isActive ? 1 : 0)
    }

    appendStringCondition('created_by', query.createdBy)
    appendStringCondition('updated_by', query.updatedBy)

    if (typeof query.minRetryCount === 'number') {
      whereConditions.push('retry_count >= ?')
      whereValues.push(query.minRetryCount)
    }

    if (typeof query.maxRetryCount === 'number') {
      whereConditions.push('retry_count <= ?')
      whereValues.push(query.maxRetryCount)
    }

    if (typeof query.maxRetries === 'number') {
      whereConditions.push('max_retries = ?')
      whereValues.push(query.maxRetries)
    }

    if (query.remarkKeyword && query.remarkKeyword.trim() !== '') {
      whereConditions.push('remark LIKE ?')
      whereValues.push(`%${query.remarkKeyword.trim()}%`)
    }

    if (query.scheduleTimeStart) {
      whereConditions.push('schedule_time >= ?')
      whereValues.push(query.scheduleTimeStart)
    }

    if (query.scheduleTimeEnd) {
      whereConditions.push('schedule_time <= ?')
      whereValues.push(query.scheduleTimeEnd)
    }

    if (query.nextExecutionTimeStart) {
      whereConditions.push('next_execution_time >= ?')
      whereValues.push(query.nextExecutionTimeStart)
    }

    if (query.nextExecutionTimeEnd) {
      whereConditions.push('next_execution_time <= ?')
      whereValues.push(query.nextExecutionTimeEnd)
    }

    if (!options?.allowEmpty && whereConditions.length === 0) {
      throw new Error('ScheduledEmail 查询至少需要一个条件')
    }

    return {
      whereConditions,
      whereValues
    }
  }
}
