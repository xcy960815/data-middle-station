import { ScheduledEmailLogMapper } from '../mapper/scheduledEmailLogMapper'
import { BaseService } from './baseService'

const logger = new Logger({ fileName: 'scheduled-email-log', folderName: 'server' })

/**
 * 定时邮件日志服务
 */
export class ScheduledEmailLogService extends BaseService {
  private scheduledEmailLogMapper: ScheduledEmailLogMapper

  constructor() {
    super()
    this.scheduledEmailLogMapper = new ScheduledEmailLogMapper()
  }

  /**
   * 创建执行日志
   */
  async createExecutionLog(logRequest: ScheduledEmailLogDto.CreateLogRequest): Promise<number> {
    try {
      const { createdBy, createTime } = await super.getDefaultInfo()

      const logData: ScheduledEmailLogDao.ExecutionLogOption = {
        id: 0, // 临时值，数据库会自动生成
        taskId: logRequest.taskId,
        executionTime: logRequest.executionTime,
        status: logRequest.status,
        message: logRequest.message,
        errorDetails: logRequest.errorDetails,
        emailMessageId: logRequest.emailMessageId,
        executionDuration: logRequest.executionDuration,
        createdTime: createTime,
        createdBy: createdBy
      }

      const logId = await this.scheduledEmailLogMapper.createScheduledEmailLog(logData)

      if (logId > 0) {
        logger.info(`执行日志创建成功: 任务ID ${logRequest.taskId}, 日志ID ${logId}, 状态: ${logRequest.status}`)
      }

      return logId
    } catch (error) {
      logger.error(`创建执行日志失败: 任务ID ${logRequest.taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 根据ID获取执行日志
   */
  async getExecutionLogById(id: number): Promise<ScheduledEmailLogDto.ExecutionLog | null> {
    try {
      const log = await this.scheduledEmailLogMapper.getScheduledEmailLogById(id)
      return log ? this.convertDaoToDto(log) : null
    } catch (error) {
      logger.error(`获取执行日志失败: ID ${id}, ${error}`)
      throw error
    }
  }

  /**
   * 获取任务执行日志列表
   */
  async getExecutionLogList(query: ScheduledEmailLogDto.LogListQuery): Promise<ScheduledEmailLogDto.LogListResponse> {
    try {
      const limit = query.limit || 50
      const offset = query.offset || 0

      // 获取日志列表和总数
      const [logs, total] = await Promise.all([
        this.scheduledEmailLogMapper.getScheduledEmailLogList(query),
        this.scheduledEmailLogMapper.getScheduledEmailLogCount(query)
      ])

      return {
        logs: logs.map((log) => this.convertDaoToDto(log)),
        total,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    } catch (error) {
      logger.error(`获取执行日志列表失败: ${JSON.stringify(query)}, ${error}`)
      throw error
    }
  }

  /**
   * 获取任务的最新执行日志
   */
  async getLatestExecutionLog(taskId: number): Promise<ScheduledEmailLogDto.ExecutionLog | null> {
    try {
      const log = await this.scheduledEmailLogMapper.getLatestLogByTaskId(taskId)
      return log ? this.convertDaoToDto(log) : null
    } catch (error) {
      logger.error(`获取最新执行日志失败: 任务ID ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 删除任务相关的所有日志
   */
  async deleteLogsByTaskId(taskId: number): Promise<boolean> {
    try {
      const success = await this.scheduledEmailLogMapper.deleteLogsByTaskId(taskId)

      if (success) {
        logger.info(`任务日志删除成功: 任务ID ${taskId}`)
      }

      return success
    } catch (error) {
      logger.error(`删除任务日志失败: 任务ID ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 获取日志统计信息
   */
  async getLogStatistics(taskId?: number): Promise<ScheduledEmailLogDto.LogStatistics> {
    try {
      const stats = await this.scheduledEmailLogMapper.getLogStatistics(taskId)
      return stats
    } catch (error) {
      logger.error(`获取日志统计信息失败: 任务ID ${taskId || 'ALL'}, ${error}`)
      throw error
    }
  }

  /**
   * 清理过期日志
   */
  async cleanupExpiredLogs(): Promise<number> {
    try {
      const deletedCount = await this.scheduledEmailLogMapper.cleanupExpiredLogs()

      if (deletedCount > 0) {
        logger.info(`清理过期日志成功: 删除 ${deletedCount} 条记录`)
      }

      return deletedCount
    } catch (error) {
      logger.error(`清理过期日志失败: ${error}`)
      throw error
    }
  }

  /**
   * 获取任务执行成功率统计
   */
  async getTaskSuccessRateStats(
    taskId: number,
    days: number = 30
  ): Promise<Array<{ date: string; successRate: number; totalCount: number; successCount: number }>> {
    try {
      return await this.scheduledEmailLogMapper.getTaskSuccessRateStats(taskId, days)
    } catch (error) {
      logger.error(`获取任务成功率统计失败: 任务ID ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 记录任务执行成功日志
   */
  async logTaskSuccess(
    taskId: number,
    executionTime: string,
    emailMessageId: string,
    executionDuration: number,
    message?: string
  ): Promise<number> {
    return await this.createExecutionLog({
      taskId,
      executionTime,
      status: 'success',
      message: message || '邮件发送成功',
      emailMessageId,
      executionDuration
    })
  }

  /**
   * 记录任务执行失败日志
   */
  async logTaskFailure(
    taskId: number,
    executionTime: string,
    errorDetails: string,
    executionDuration: number,
    message?: string
  ): Promise<number> {
    return await this.createExecutionLog({
      taskId,
      executionTime,
      status: 'failed',
      message: message || '邮件发送失败',
      errorDetails,
      executionDuration
    })
  }

  /**
   * 获取任务的执行历史摘要
   */
  async getTaskExecutionSummary(taskId: number): Promise<{
    latestLog: ScheduledEmailLogDto.ExecutionLog | null
    statistics: ScheduledEmailLogDto.LogStatistics
    recentLogs: ScheduledEmailLogDto.ExecutionLog[]
  }> {
    try {
      // 并行获取数据
      const [latestLog, statistics, recentLogsResult] = await Promise.all([
        this.getLatestExecutionLog(taskId),
        this.getLogStatistics(taskId),
        this.getExecutionLogList({
          taskId,
          limit: 10,
          offset: 0
        })
      ])

      return {
        latestLog,
        statistics,
        recentLogs: recentLogsResult.logs
      }
    } catch (error) {
      logger.error(`获取任务执行摘要失败: 任务ID ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 转换DAO对象为DTO对象
   */
  private convertDaoToDto(dao: ScheduledEmailLogDao.ExecutionLogOption): ScheduledEmailLogDto.ExecutionLog {
    return {
      id: dao.id,
      taskId: dao.taskId,
      executionTime: dao.executionTime,
      status: dao.status,
      message: dao.message,
      errorDetails: dao.errorDetails,
      emailMessageId: dao.emailMessageId,
      executionDuration: dao.executionDuration,
      createdTime: dao.createdTime,
      createdBy: dao.createdBy
    }
  }
}
