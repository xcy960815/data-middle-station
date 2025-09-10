import type { ResultSetHeader } from 'mysql2'
import { BaseMapper, Column, Mapping, Row, entityColumnsMap, mapToTarget, type IColumnTarget } from './baseMapper'

// 定时邮件任务基础字段
export const SCHEDULED_EMAIL_TASK_BASE_FIELDS = [
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

// 执行日志基础字段
export const SCHEDULED_EMAIL_LOG_BASE_FIELDS = [
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
 * 定时邮件任务映射类
 */
export class ScheduledEmailTaskMapping implements ScheduledEmailDao.ScheduledEmailOption, IColumnTarget {
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
 * 定时邮件执行日志映射类
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

/**
 * 定时邮件任务数据访问层
 */
export class ScheduledEmailMapper extends BaseMapper {
  dataSourceName = 'default'

  /**
   * 创建定时邮件任务
   */
  @Mapping(ScheduledEmailTaskMapping)
  async createTask(params: ScheduledEmailDao.CreateTaskParams): Promise<ScheduledEmailDao.ScheduledEmailOption> {
    const sql = `
      INSERT INTO scheduled_email_tasks (
        task_name, schedule_time, email_config, chart_data, remark, max_retries
      ) VALUES (?, ?, ?, ?, ?, ?)
    `
    const result = await this.exe<ResultSetHeader>(sql, [
      params.task_name,
      params.schedule_time,
      params.email_config,
      params.chart_data,
      params.remark || null,
      params.max_retries || 3
    ])

    return this.getTaskById(result.insertId)
  }

  /**
   * 根据ID获取任务
   */
  @Mapping(ScheduledEmailTaskMapping)
  async getTaskById(id: number): Promise<ScheduledEmailDao.ScheduledEmailOption> {
    const sql = `
      SELECT ${SCHEDULED_EMAIL_TASK_BASE_FIELDS.join(', ')}
      FROM scheduled_email_tasks
      WHERE id = ?
    `
    const result = await this.exe<ScheduledEmailDao.ScheduledEmailOption[]>(sql, [id])
    return result[0]
  }

  /**
   * 更新任务
   */
  async updateTask(params: ScheduledEmailDao.UpdateTaskParams): Promise<boolean> {
    const updateFields: string[] = []
    const updateValues: any[] = []

    // 动态构建更新字段
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    })

    if (updateFields.length === 0) {
      return false
    }

    updateValues.push(params.id)
    const sql = `
      UPDATE scheduled_email_tasks
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    const result = await this.exe<ResultSetHeader>(sql, updateValues)
    return result.affectedRows > 0
  }

  /**
   * 删除任务
   */
  async deleteTask(id: number): Promise<boolean> {
    const sql = 'DELETE FROM scheduled_email_tasks WHERE id = ?'
    const result = await this.exe<ResultSetHeader>(sql, [id])
    return result.affectedRows > 0
  }

  /**
   * 查询任务列表
   */
  @Mapping(ScheduledEmailTaskMapping)
  async getTaskList(params: ScheduledEmailDao.QueryParams): Promise<ScheduledEmailDao.ScheduledEmailOption[]> {
    const whereConditions: string[] = []
    const whereValues: any[] = []

    // 构建查询条件
    if (params.status) {
      whereConditions.push('status = ?')
      whereValues.push(params.status)
    }

    if (params.task_name) {
      whereConditions.push('task_name LIKE ?')
      whereValues.push(`%${params.task_name}%`)
    }

    if (params.start_time) {
      whereConditions.push('schedule_time >= ?')
      whereValues.push(params.start_time)
    }

    if (params.end_time) {
      whereConditions.push('schedule_time <= ?')
      whereValues.push(params.end_time)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    let sql = `
      SELECT ${SCHEDULED_EMAIL_TASK_BASE_FIELDS.join(', ')}
      FROM scheduled_email_tasks
      ${whereClause}
      ORDER BY created_at DESC
    `

    // 添加分页
    if (params.limit) {
      sql += ` LIMIT ${params.limit}`
      if (params.offset) {
        sql += ` OFFSET ${params.offset}`
      }
    }

    return this.exe<ScheduledEmailDao.ScheduledEmailOption[]>(sql, whereValues)
  }

  /**
   * 获取任务总数
   */
  async getTaskCount(params: ScheduledEmailDao.QueryParams): Promise<number> {
    const whereConditions: string[] = []
    const whereValues: any[] = []

    if (params.status) {
      whereConditions.push('status = ?')
      whereValues.push(params.status)
    }

    if (params.task_name) {
      whereConditions.push('task_name LIKE ?')
      whereValues.push(`%${params.task_name}%`)
    }

    if (params.start_time) {
      whereConditions.push('schedule_time >= ?')
      whereValues.push(params.start_time)
    }

    if (params.end_time) {
      whereConditions.push('schedule_time <= ?')
      whereValues.push(params.end_time)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const sql = `
      SELECT COUNT(*) as count
      FROM scheduled_email_tasks
      ${whereClause}
    `

    const result = await this.exe<{ count: number }[]>(sql, whereValues)
    return result[0].count
  }

  /**
   * 获取待执行的任务
   */
  @Mapping(ScheduledEmailTaskMapping)
  async getPendingTasks(currentTime: string): Promise<ScheduledEmailDao.ScheduledEmailOption[]> {
    const sql = `
      SELECT ${SCHEDULED_EMAIL_TASK_BASE_FIELDS.join(', ')}
      FROM scheduled_email_tasks
      WHERE status = 'pending'
        AND schedule_time <= ?
      ORDER BY schedule_time ASC
    `
    return this.exe<ScheduledEmailDao.ScheduledEmailOption[]>(sql, [currentTime])
  }

  /**
   * 获取需要重试的失败任务
   */
  @Mapping(ScheduledEmailTaskMapping)
  async getRetryableTasks(): Promise<ScheduledEmailDao.ScheduledEmailOption[]> {
    const sql = `
      SELECT ${SCHEDULED_EMAIL_TASK_BASE_FIELDS.join(', ')}
      FROM scheduled_email_tasks
      WHERE status = 'failed'
        AND retry_count < max_retries
      ORDER BY schedule_time ASC
    `
    return this.exe<ScheduledEmailDao.ScheduledEmailOption[]>(sql)
  }

  /**
   * 创建执行日志
   */
  async createExecutionLog(params: ScheduledEmailDao.CreateLogParams): Promise<number> {
    const sql = `
      INSERT INTO scheduled_email_logs (
        task_id, execution_time, status, message, error_details, email_message_id, execution_duration
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const result = await this.exe<ResultSetHeader>(sql, [
      params.task_id,
      params.execution_time,
      params.status,
      params.message || null,
      params.error_details || null,
      params.email_message_id || null,
      params.execution_duration || null
    ])

    return result.insertId
  }

  /**
   * 获取任务执行日志
   */
  @Mapping(ScheduledEmailLogMapping)
  async getTaskLogs(taskId: number, limit: number = 20): Promise<ScheduledEmailDao.ExecutionLogOption[]> {
    const sql = `
      SELECT ${SCHEDULED_EMAIL_LOG_BASE_FIELDS.join(', ')}
      FROM scheduled_email_logs
      WHERE task_id = ?
      ORDER BY execution_time DESC
      LIMIT ?
    `
    return this.exe<ScheduledEmailDao.ExecutionLogOption[]>(sql, [taskId, limit])
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStatistics(): Promise<ScheduledEmailDto.TaskStatistics> {
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
      FROM scheduled_email_tasks
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
