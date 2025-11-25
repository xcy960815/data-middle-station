import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, entityColumnsMap, Mapping, mapToTarget } from '@/server/mapper/baseMapper'
import { batchFormatSqlKey, convertToSqlProperties } from '@/server/utils/databaseHelpper'
import type { ResultSetHeader } from 'mysql2'

/**
 * @desc 执行日志基础字段
 */
const SCHEDULED_EMAIL_LOG_BASE_FIELDS = [
  'id',
  'task_id',
  'execution_time',
  'execution_timezone',
  'status',
  'message',
  'error_details',
  'email_message_id',
  'sender_email',
  'sender_name',
  'recipient_to',
  'recipient_cc',
  'recipient_bcc',
  'reply_to',
  'email_subject',
  'attachment_count',
  'attachment_names',
  'email_channel',
  'provider',
  'provider_response',
  'accepted_recipients',
  'rejected_recipients',
  'retry_count',
  'raw_request_payload',
  'raw_response_payload',
  'smtp_host',
  'smtp_port',
  'execution_duration',
  'created_time',
  'created_timezone',
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
class ScheduledEmailLogMapping implements ScheduledEmailLogDao.ScheduledEmailLogOptions, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * id
   */
  @Column('id')
  id!: number

  /**
   * 任务ID
   */
  @Column('task_id')
  taskId!: number

  /**
   * 执行时间
   */
  @Column('execution_time')
  executionTime!: string

  /**
   * 执行时区
   */
  @Column('execution_timezone')
  executionTimezone?: string

  /**
   * 状态
   */
  @Column('status')
  status!: 'success' | 'failed'

  /**
   * 消息
   */
  @Column('message')
  message?: string

  /**
   * 错误详情
   */
  @Column('error_details')
  errorDetails?: string

  /**
   * 邮件消息ID
   */
  @Column('email_message_id')
  emailMessageId?: string

  /**
   * 发件人邮箱
   */
  @Column('sender_email')
  senderEmail?: string

  /**
   * 发件人名称
   */
  @Column('sender_name')
  senderName?: string

  /**
   * 收件人(To)
   */
  @Column('recipient_to')
  recipientTo?: string

  /**
   * 抄送
   */
  @Column('recipient_cc')
  recipientCc?: string

  /**
   * 密送
   */
  @Column('recipient_bcc')
  recipientBcc?: string

  /**
   * 回复地址
   */
  @Column('reply_to')
  replyTo?: string

  /**
   * 邮件主题
   */
  @Column('email_subject')
  emailSubject?: string

  /**
   * 附件数量
   */
  @Column('attachment_count')
  attachmentCount?: number

  /**
   * 附件名称
   */
  @Column('attachment_names')
  attachmentNames?: string

  /**
   * 邮件通道
   */
  @Column('email_channel')
  emailChannel?: string

  /**
   * 服务提供方
   */
  @Column('provider')
  provider?: string

  /**
   * 服务响应
   */
  @Column('provider_response')
  providerResponse?: string

  /**
   * 接收成功的收件人
   */
  @Column('accepted_recipients')
  acceptedRecipients?: string

  /**
   * 拒收的收件人
   */
  @Column('rejected_recipients')
  rejectedRecipients?: string

  /**
   * 重试次数
   */
  @Column('retry_count')
  retryCount?: number

  /**
   * 原始请求
   */
  @Column('raw_request_payload')
  rawRequestPayload?: string

  /**
   * 原始响应
   */
  @Column('raw_response_payload')
  rawResponsePayload?: string

  /**
   * SMTP主机
   */
  @Column('smtp_host')
  smtpHost?: string

  /**
   * SMTP端口
   */
  @Column('smtp_port')
  smtpPort?: number

  /**
   * 执行时长
   */
  @Column('execution_duration')
  executionDuration?: number

  /**
   * 创建时间
   */
  @Column('created_time')
  createdTime!: string

  /**
   * 创建时区
   */
  @Column('created_timezone')
  createdTimezone?: string

  /**
   * 创建人
   */
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
   * @param {ScheduledEmailLogDao.CreateScheduledEmailLogOptions} log  执行日志选项
   * @returns {Promise<number>} 日志ID
   */
  public async createScheduledEmailLog(
    scheduledEmailLogOptions: ScheduledEmailLogDao.CreateScheduledEmailLogOptions
  ): Promise<number> {
    const { keys, values } = convertToSqlProperties(scheduledEmailLogOptions)
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
   * @returns {Promise<ScheduledEmailLogDao.ScheduledEmailLogOptions | null>} 执行日志
   */
  @Mapping(ScheduledEmailLogMapping)
  public async getScheduledEmailLogById<
    T extends ScheduledEmailLogDao.ScheduledEmailLogOptions = ScheduledEmailLogDao.ScheduledEmailLogOptions
  >(id: number): Promise<T | null> {
    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_LOG_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      WHERE id = ?
    `
    const result = await this.exe<T[]>(sql, [id])
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
  ): Promise<ScheduledEmailLogDao.ScheduledEmailLogOptions[]> {
    const whereConditions: string[] = []
    const whereValues: (string | number | ScheduledEmailLogDao.Status)[] = []

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

    return this.exe<ScheduledEmailLogDao.ScheduledEmailLogOptions[]>(sql, [...whereValues, limit, offset])
  }

  /**
   * @desc 获取任务执行日志总数
   * @param {ScheduledEmailLogDao.LogListQuery} query  查询参数
   * @returns {Promise<number>} 总数
   */
  public async getScheduledEmailLogCount(query: ScheduledEmailLogDao.LogListQuery): Promise<number> {
    const whereConditions: string[] = []
    const whereValues: (string | number | ScheduledEmailLogDao.Status)[] = []

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
   * @returns {Promise<ScheduledEmailLogDao.ScheduledEmailLogOptions | null>} 最新执行日志
   */
  @Mapping(ScheduledEmailLogMapping)
  public async getLatestLogByTaskId<
    T extends ScheduledEmailLogDao.ScheduledEmailLogOptions = ScheduledEmailLogDao.ScheduledEmailLogOptions
  >(taskId: number): Promise<T | null> {
    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_LOG_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      WHERE task_id = ?
      ORDER BY execution_time DESC
      LIMIT 1
    `
    const result = await this.exe<T[]>(sql, [taskId])
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
