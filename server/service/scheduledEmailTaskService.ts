import { ScheduledEmailMapper } from '@/server/mapper/scheduledEmailMapper'
import { BaseService } from '@/server/service/baseService'
import { calculateNextExecutionTime } from '@/server/utils/schedulerUtils'

const logger = new Logger({ fileName: 'scheduled-email', folderName: 'server' })

/**
 * 定时邮件任务管理服务。
 * 只负责任务的创建、查询、编辑、删除、状态切换和视图转换。
 */
export class ScheduledEmailTaskService extends BaseService {
  private scheduledEmailMapper: ScheduledEmailMapper

  constructor() {
    super()
    this.scheduledEmailMapper = new ScheduledEmailMapper()
  }

  async createScheduledEmailTask(createOptions: ScheduledEmailDto.CreateScheduledEmailOptions): Promise<boolean> {
    try {
      if (createOptions.taskType === 'scheduled') {
        if (!createOptions.scheduleTime) {
          throw new Error('定时任务必须指定执行时间')
        }

        const scheduleTime = new Date(createOptions.scheduleTime)
        const now = new Date()

        if (scheduleTime <= now) {
          throw new Error('执行时间必须大于当前时间')
        }
      } else if (createOptions.taskType === 'recurring') {
        if (!createOptions.recurringDays || !createOptions.recurringTime) {
          throw new Error('重复任务必须指定重复日期和执行时间')
        }

        if (!Array.isArray(createOptions.recurringDays) || createOptions.recurringDays.length === 0) {
          throw new Error('重复任务必须至少选择一个执行日期')
        }
      }

      const { createdBy, updatedBy, createTime, updateTime } = await super.getDefaultInfo()

      let nextExecutionTime: string | null = null
      if (createOptions.taskType === 'recurring') {
        nextExecutionTime = calculateNextExecutionTime(createOptions.recurringDays!, createOptions.recurringTime!)
      } else if (createOptions.taskType === 'scheduled') {
        nextExecutionTime = createOptions.scheduleTime!
      }

      const createParams: ScheduledEmailDao.CreateScheduledEmailOptions = {
        taskName: createOptions.taskName,
        scheduleTime: createOptions.scheduleTime || null,
        taskType: createOptions.taskType,
        recurringDays: createOptions.recurringDays || null,
        recurringTime: createOptions.recurringTime || null,
        isActive: true,
        nextExecutionTime,
        emailConfig: createOptions.emailConfig,
        analyzeOptions: createOptions.analyzeOptions,
        status: 'pending',
        remark: createOptions.remark,
        maxRetries: 3,
        retryCount: 0,
        errorMessage: null,
        createdTime: createTime,
        updatedTime: updateTime,
        executedTime: null,
        createdBy,
        updatedBy
      }

      const taskId = await this.scheduledEmailMapper.createScheduledEmailTask(createParams)

      logger.info(`${createOptions.taskType === 'scheduled' ? '定时' : '重复'}邮件任务创建成功: ${taskId}`)

      return taskId > 0
    } catch (error) {
      logger.error(`创建邮件任务失败: ${error}`)
      throw error
    }
  }

  async getScheduledEmailTask(
    queryOptions: ScheduledEmailDto.GetScheduledEmailOptions
  ): Promise<ScheduledEmailVo.ScheduledEmailOptions | null> {
    const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask(queryOptions)
    return scheduledEmailRecord ? this.convertDaoToVo(scheduledEmailRecord) : null
  }

  async updateScheduledEmailTask(updateOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask({
      id: updateOptions.id
    })
    if (!scheduledEmailRecord) {
      throw new Error('任务不存在')
    }

    if (!['pending', 'failed'].includes(scheduledEmailRecord.status)) {
      throw new Error('只有待执行或失败的任务可以编辑')
    }

    if (updateOptions.scheduleTime) {
      const scheduleTime = new Date(updateOptions.scheduleTime)
      const now = new Date()

      if (scheduleTime <= now) {
        throw new Error('执行时间必须大于当前时间')
      }
    }

    const { updatedBy, updateTime } = await super.getDefaultInfo()

    const updateParams: ScheduledEmailDao.UpdateScheduledEmailOptions = {
      ...scheduledEmailRecord,
      id: updateOptions.id,
      taskName: updateOptions.taskName || scheduledEmailRecord.taskName,
      scheduleTime:
        updateOptions.scheduleTime !== undefined ? updateOptions.scheduleTime : scheduledEmailRecord.scheduleTime,
      emailConfig: updateOptions.emailConfig || scheduledEmailRecord.emailConfig,
      analyzeOptions: updateOptions.analyzeOptions || scheduledEmailRecord.analyzeOptions,
      remark: updateOptions.remark !== undefined ? updateOptions.remark : scheduledEmailRecord.remark,
      recurringDays:
        updateOptions.recurringDays !== undefined ? updateOptions.recurringDays : scheduledEmailRecord.recurringDays,
      recurringTime:
        updateOptions.recurringTime !== undefined ? updateOptions.recurringTime : scheduledEmailRecord.recurringTime,
      updatedBy,
      updatedTime: updateTime
    }

    return this.scheduledEmailMapper.updateScheduledEmailTask(updateParams)
  }

  async deleteScheduledEmailTask(deleteOptions: ScheduledEmailDto.DeleteScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask(deleteOptions)
      if (!scheduledEmailRecord) {
        throw new Error('任务不存在')
      }

      if (scheduledEmailRecord.status === 'running') {
        throw new Error('正在执行的任务不能删除')
      }

      const deletedCount = await this.scheduledEmailMapper.deleteScheduledEmailTask(deleteOptions)

      if (deletedCount > 0) {
        logger.info(`定时邮件任务删除成功: ${JSON.stringify(deleteOptions)}，删除数量 ${deletedCount}`)
      }

      return deletedCount > 0
    } catch (error) {
      logger.error(`删除定时邮件任务失败: ${JSON.stringify(deleteOptions)}, ${error}`)
      throw error
    }
  }

  async getScheduledEmailTaskList(
    scheduledEmailListQuery: ScheduledEmailDto.ScheduledEmailListQuery
  ): Promise<ScheduledEmailVo.ScheduledEmailOptions[]> {
    try {
      const scheduledEmailRecordList =
        await this.scheduledEmailMapper.getScheduledEmailTaskList(scheduledEmailListQuery)
      return scheduledEmailRecordList.map((scheduledEmailDao) => this.convertDaoToVo(scheduledEmailDao))
    } catch (error) {
      logger.error(`获取定时邮件任务列表失败: ${JSON.stringify(scheduledEmailListQuery)}, ${error}`)
      throw error
    }
  }

  async toggleTaskStatus(toggleOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailRecord = await this.scheduledEmailMapper.getScheduledEmailTask({
        id: toggleOptions.id
      })
      if (!scheduledEmailRecord) {
        throw new Error('任务不存在')
      }

      let newStatus: 'pending' | 'cancelled'

      if (scheduledEmailRecord.status === 'pending') {
        newStatus = 'cancelled'
      } else if (scheduledEmailRecord.status === 'cancelled') {
        newStatus = 'pending'
        if (scheduledEmailRecord.scheduleTime) {
          const scheduleTime = new Date(scheduledEmailRecord.scheduleTime)
          const now = new Date()

          if (scheduleTime <= now) {
            throw new Error('任务执行时间已过期，无法启用')
          }
        }
      } else {
        throw new Error('只有待执行或已取消的任务可以切换状态')
      }

      return this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailRecord,
        id: toggleOptions.id,
        status: newStatus,
        errorMessage: newStatus === 'pending' ? undefined : scheduledEmailRecord.errorMessage,
        retryCount: newStatus === 'pending' ? 0 : scheduledEmailRecord.retryCount,
        updatedTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })
    } catch (error) {
      logger.error(`切换任务状态失败: ${toggleOptions.id}, ${error}`)
      throw error
    }
  }

  private convertDaoToVo(record: ScheduledEmailDao.ScheduledEmailOptions): ScheduledEmailVo.ScheduledEmailOptions {
    return {
      id: record.id,
      taskName: record.taskName,
      taskType: record.taskType,
      scheduleTime: record.scheduleTime || null,
      recurringDays: record.recurringDays || null,
      recurringTime: record.recurringTime || null,
      isActive: record.isActive,
      nextExecutionTime: record.nextExecutionTime || null,
      emailConfig: {
        to: Array.isArray(record.emailConfig.to) ? record.emailConfig.to.join(',') : record.emailConfig.to,
        subject: record.emailConfig.subject,
        additionalContent: record.emailConfig.additionalContent
      },
      analyzeOptions: record.analyzeOptions,
      status: record.status,
      remark: record.remark,
      createdTime: record.createdTime,
      updatedTime: record.updatedTime,
      executedTime: record.executedTime || null,
      errorMessage: record.errorMessage,
      retryCount: record.retryCount,
      maxRetries: record.maxRetries,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy
    }
  }
}
