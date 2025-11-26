import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, entityColumnsMap, Mapping, mapToTarget } from '@/server/mapper/baseMapper'
import { batchFormatSqlKey, batchFormatSqlSet, convertToSqlProperties } from '@/server/utils/databaseHelpper'
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
   * @param taskId 任务主键 ID
   * @returns 匹配的任务记录（若存在）
   */
  @Mapping(ScheduledEmailTaskMapping)
  public async getScheduledEmailTaskById<
    T extends ScheduledEmailDao.ScheduledEmailOptions = ScheduledEmailDao.ScheduledEmailOptions
  >(taskId: number): Promise<T> {
    const sql = `select
          ${batchFormatSqlKey(SCHEDULED_EMAIL_TASK_BASE_FIELDS)}
            from ${SCHEDULED_EMAIL_TASK_TABLE_NAME}
          where id = ?`
    const result = await this.exe<Array<T>>(sql, [taskId])

    return result?.[0]
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
  public async deleteScheduledEmailTask(deleteParams: { id: number }): Promise<boolean> {
    const sql = `delete from ${SCHEDULED_EMAIL_TASK_TABLE_NAME} where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [deleteParams.id])
    return result.affectedRows > 0
  }

  /**
   * @desc 查询定时邮件任务列表
   * @param params 查询条件（支持按状态、任务名模糊查询）
   * @returns 匹配的任务列表
   */
  @Mapping(ScheduledEmailTaskMapping)
  public async getScheduledEmailList(
    params: ScheduledEmailDto.ScheduledEmailListRequest
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
}
