// cspell:ignore CURDATE
import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { batchFormatSqlKey, convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

/**
 * 执行日志基础字段
 * @type {string[]}
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

  'created_by'
]

/**
 * 执行日志表名
 * @type {string}
 */
const SCHEDULED_EMAIL_LOG_TABLE_NAME = 'scheduled_email_logs'

/**
 * 数据源名称
 * @type {string}
 */
const DATA_SOURCE_NAME = 'data_middle_station'

/**
 * 定时邮件执行日志实体属性映射类
 * @implements {ScheduledEmailLogDao.ScheduledEmailLogRecord}
 * @implements {IColumnTarget}
 */
class ScheduledEmailLogMapping implements ScheduledEmailLogDao.ScheduledEmailLogRecord, IColumnTarget {
  /**
   * 属性与字段映射器
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的属性对象
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 日志记录自增 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 定时邮件任务 ID
   * @type {number}
   */
  @Column('task_id')
  taskId!: number

  /**
   * 任务实际执行时间
   * @type {string}
   */
  @Column('execution_time')
  executionTime!: string

  /**
   * 执行时使用的时区
   * @type {string}
   */
  @Column('execution_timezone')
  executionTimezone?: string

  /**
   * 邮件发送状态：success 成功，failed 失败
   * @type {'success' | 'failed'}
   */
  @Column('status')
  status!: 'success' | 'failed'

  /**
   * 提示或摘要消息
   * @type {string}
   */
  @Column('message')
  message?: string

  /**
   * 发送失败时的错误详细信息
   * @type {string}
   */
  @Column('error_details')
  errorDetails?: string

  /**
   * 邮件服务器或服务商返回的 Message-ID
   * @type {string}
   */
  @Column('email_message_id')
  emailMessageId?: string

  /**
   * 发件人邮箱地址
   * @type {string}
   */
  @Column('sender_email')
  senderEmail?: string

  /**
   * 发件人显示名称
   * @type {string}
   */
  @Column('sender_name')
  senderName?: string

  /**
   * 收件人地址列表，以逗号分隔
   * @type {string}
   */
  @Column('recipient_to')
  recipientTo?: string

  /**
   * 抄送收件人地址列表，以逗号分隔
   * @type {string}
   */
  @Column('recipient_cc')
  recipientCc?: string

  /**
   * 密送收件人地址列表，以逗号分隔
   * @type {string}
   */
  @Column('recipient_bcc')
  recipientBcc?: string

  /**
   * 回复地址
   * @type {string}
   */
  @Column('reply_to')
  replyTo?: string

  /**
   * 邮件主题
   * @type {string}
   */
  @Column('email_subject')
  emailSubject?: string

  /**
   * 邮件附件总数
   * @type {number}
   */
  @Column('attachment_count')
  attachmentCount?: number

  /**
   * 附件文件名列表，以逗号分隔
   * @type {string}
   */
  @Column('attachment_names')
  attachmentNames?: string

  /**
   * 邮件通道标识
   * @type {string}
   */
  @Column('email_channel')
  emailChannel?: string

  /**
   * 邮件发送服务商名称
   * @type {string}
   */
  @Column('provider')
  provider?: string

  /**
   * 服务提供方的原始响应内容
   * @type {string}
   */
  @Column('provider_response')
  providerResponse?: string

  /**
   * 接收成功的收件人列表，以逗号分隔
   * @type {string}
   */
  @Column('accepted_recipients')
  acceptedRecipients?: string

  /**
   * 拒收或发送失败的收件人列表，以逗号分隔
   * @type {string}
   */
  @Column('rejected_recipients')
  rejectedRecipients?: string

  /**
   * 重试发送次数
   * @type {number}
   */
  @Column('retry_count')
  retryCount?: number

  /**
   * 原始发送请求 Payload (JSON 字符串)
   * @type {string}
   */
  @Column('raw_request_payload')
  rawRequestPayload?: string

  /**
   * 原始接收响应 Payload (JSON 字符串)
   * @type {string}
   */
  @Column('raw_response_payload')
  rawResponsePayload?: string

  /**
   * SMTP 服务器主机名
   * @type {string}
   */
  @Column('smtp_host')
  smtpHost?: string

  /**
   * SMTP 服务器端口号
   * @type {number}
   */
  @Column('smtp_port')
  smtpPort?: number

  /**
   * 任务执行所消耗的时长（毫秒）
   * @type {number}
   */
  @Column('execution_duration')
  executionDuration?: number

  /**
   * 日志记录创建时间
   * @type {string}
   */
  @Column('created_time')
  createdTime!: string

  /**
   * 创建人或创建系统
   * @type {string}
   */
  @Column('created_by')
  createdBy!: string
}

/**
 * 定时邮件执行日志数据访问对象 (Mapper)，负责日志的写入、查询和清理
 * @extends {BaseMapper}
 */
export class ScheduledEmailLogMapper extends BaseMapper {
  /**
   * 数据源名称
   * @type {string}
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * 创建一条定时邮件执行日志记录
   * @param {ScheduledEmailLogDao.CreateScheduledEmailLogParams} createScheduledEmailLogParams 创建执行日志所需的参数对象
   * @returns {Promise<number>} 新增的日志记录主键 ID，如果失败则返回 0
   */
  public async createScheduledEmailLog(
    createScheduledEmailLogParams: ScheduledEmailLogDao.CreateScheduledEmailLogParams
  ): Promise<number> {
    const { keys, values } = convertToSqlProperties(createScheduledEmailLogParams)
    // 只使用数据库表中存在的字段
    const validKeys = keys.filter((key) => SCHEDULED_EMAIL_LOG_BASE_FIELDS.includes(key))
    const validValues = validKeys.map((key) => values[keys.indexOf(key)])
    const sql = `INSERT INTO ${SCHEDULED_EMAIL_LOG_TABLE_NAME} (${batchFormatSqlKey(validKeys)}) VALUES (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, validValues)
    return result.insertId || 0
  }

  /**
   * 根据查询条件获取单条执行日志记录
   * @template T
   * @param {ScheduledEmailLogDao.GetScheduledEmailLogQuery} query 查询过滤条件
   * @returns {Promise<T | null>} 匹配的执行日志记录；若未匹配则返回 null
   * @throws {Error} 如果查询参数中没有任何有效过滤字段，则抛出异常
   */
  @Mapping(ScheduledEmailLogMapping)
  public async getScheduledEmailLog<
    T extends ScheduledEmailLogDao.ScheduledEmailLogRecord = ScheduledEmailLogDao.ScheduledEmailLogRecord
  >(query: ScheduledEmailLogDao.GetScheduledEmailLogQuery): Promise<T | null> {
    const whereConditions: string[] = []
    const whereValues: Array<string | number | ScheduledEmailLogDao.Status> = []

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
    appendNumberCondition('task_id', query.taskId)

    if (query.status) {
      whereConditions.push('status = ?')
      whereValues.push(query.status)
    }

    appendStringCondition('email_message_id', query.emailMessageId)
    appendStringCondition('sender_email', query.senderEmail)
    appendStringCondition('sender_name', query.senderName)
    appendStringCondition('recipient_to', query.recipientTo)
    appendStringCondition('recipient_cc', query.recipientCc)
    appendStringCondition('recipient_bcc', query.recipientBcc)
    appendStringCondition('email_subject', query.emailSubject)
    appendStringCondition('email_channel', query.emailChannel)
    appendStringCondition('provider', query.provider)
    appendStringCondition('created_by', query.createdBy)

    if (whereConditions.length === 0) {
      throw new Error('getScheduledEmailLog 至少需要一个查询条件')
    }

    const sql = `
      SELECT ${batchFormatSqlKey(SCHEDULED_EMAIL_LOG_BASE_FIELDS)}
      FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      WHERE ${whereConditions.join(' AND ')}
      LIMIT 1
    `

    const result = await this.exe<T[]>(sql, whereValues)
    return result?.[0] || null
  }

  /**
   * 获取定时邮件执行日志列表（支持分页、根据状态和时间范围过滤）
   * @param {ScheduledEmailLogDao.LogListQuery} query 分页与过滤参数
   * @returns {Promise<ScheduledEmailLogDao.ScheduledEmailLogRecord[]>} 日志记录数组
   */
  @Mapping(ScheduledEmailLogMapping)
  public async getScheduledEmailLogList(
    query: ScheduledEmailLogDao.LogListQuery
  ): Promise<ScheduledEmailLogDao.ScheduledEmailLogRecord[]> {
    const whereConditions: string[] = []
    const whereValues: Array<string | number | ScheduledEmailLogDao.Status> = []

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

    return this.exe<ScheduledEmailLogDao.ScheduledEmailLogRecord[]>(sql, [...whereValues, limit, offset])
  }

  /**
   * 获取符合指定查询条件的执行日志总条数，主要用于分页计算
   * @param {ScheduledEmailLogDao.LogListQuery} query 查询与过滤参数
   * @returns {Promise<number>} 日志记录的总条数
   */
  public async getScheduledEmailLogCount(query: ScheduledEmailLogDao.LogListQuery): Promise<number> {
    const whereConditions: string[] = []
    const whereValues: Array<string | number | ScheduledEmailLogDao.Status> = []

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
   * 根据任务 ID 获取该任务最新的一条执行日志记录
   * @template T
   * @param {number} taskId 任务 ID
   * @returns {Promise<T | null>} 最新的一条日志记录；若无记录则返回 null
   */
  @Mapping(ScheduledEmailLogMapping)
  public async getLatestLogByTaskId<
    T extends ScheduledEmailLogDao.ScheduledEmailLogRecord = ScheduledEmailLogDao.ScheduledEmailLogRecord
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
   * 根据指定条件批量删除执行日志
   * @param {ScheduledEmailLogDao.DeleteScheduledEmailLogParams} query 删除过滤条件
   * @returns {Promise<number>} 被删除的日志条数
   * @throws {Error} 如果查询参数中没有任何过滤字段，则拒绝执行并抛出异常
   */
  public async deleteLogs(query: ScheduledEmailLogDao.DeleteScheduledEmailLogParams): Promise<number> {
    const whereConditions: string[] = []
    const whereValues: Array<string | number | ScheduledEmailLogDao.Status> = []

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
    appendNumberCondition('task_id', query.taskId)

    if (query.status) {
      whereConditions.push('status = ?')
      whereValues.push(query.status)
    }

    appendStringCondition('email_message_id', query.emailMessageId)
    appendStringCondition('sender_email', query.senderEmail)
    appendStringCondition('sender_name', query.senderName)
    appendStringCondition('recipient_to', query.recipientTo)
    appendStringCondition('recipient_cc', query.recipientCc)
    appendStringCondition('recipient_bcc', query.recipientBcc)
    appendStringCondition('email_subject', query.emailSubject)
    appendStringCondition('email_channel', query.emailChannel)
    appendStringCondition('provider', query.provider)
    appendStringCondition('created_by', query.createdBy)

    if (whereConditions.length === 0) {
      throw new Error('deleteLogs 至少需要一个查询条件')
    }

    const sql = `
      DELETE FROM ${SCHEDULED_EMAIL_LOG_TABLE_NAME}
      WHERE ${whereConditions.join(' AND ')}
    `

    const result = await this.exe<ResultSetHeader>(sql, whereValues)
    return result.affectedRows || 0
  }

  /**
   * 清理过期日志（保留最近 30 天的执行日志，多余的将被彻底删除）
   * @returns {Promise<number>} 成功清理的日志行数
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
   * 获取任务的执行成功率统计（按天分组）
   * @param {ScheduledEmailLogDao.TaskSuccessRateQuery} query 统计过滤参数与日期区间
   * @returns {Promise<Array<{ date: string; successRate: number; totalCount: number; successCount: number }>>} 按天统计的成功率数组
   * @throws {Error} 如果查询参数中没有任何过滤条件，则抛出异常
   */
  public async getTaskSuccessRateStats(
    query: ScheduledEmailLogDao.TaskSuccessRateQuery
  ): Promise<Array<{ date: string; successRate: number; totalCount: number; successCount: number }>> {
    const whereConditions: string[] = []
    const whereValues: Array<string | number | ScheduledEmailLogDao.Status> = []

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

    appendNumberCondition('task_id', query.taskId)

    if (query.status) {
      whereConditions.push('status = ?')
      whereValues.push(query.status)
    }

    appendStringCondition('email_channel', query.emailChannel)
    appendStringCondition('provider', query.provider)
    appendStringCondition('created_by', query.createdBy)

    if (query.startTime) {
      whereConditions.push('execution_time >= ?')
      whereValues.push(query.startTime)
    }

    if (query.endTime) {
      whereConditions.push('execution_time <= ?')
      whereValues.push(query.endTime)
    }

    if (!query.startTime && !query.endTime) {
      const days = query.days ?? 30
      whereConditions.push('execution_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)')
      whereValues.push(days)
    }

    if (whereConditions.length === 0) {
      throw new Error('getTaskSuccessRateStats 至少需要一个查询条件')
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`

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
      ${whereClause}
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
    >(sql, whereValues)

    return result.map((row) => ({
      date: row.date,
      successRate: row.success_rate || 0,
      totalCount: row.total_count,
      successCount: row.success_count
    }))
  }
}
