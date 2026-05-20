/**
 * @desc 定时邮件 - 任务执行器
 *
 * 拆分动机：
 *  - 原 `ScheduledEmailService` 内的 `processTask` 周边逻辑（抢占 → 发送 → 写回 → 重试 / 回收）
 *    占了整个类一半以上的体量，且与 CRUD 完全不同维度
 *  - 此处单独成类后，CRUD（QueryService 也即 Facade）只关心数据形态，
 *    Executor 专注"任务生命周期 + 副作用 + 调度联动"
 *
 * 职责：
 *  - 抢占任务执行权（claim）→ 调用 SendEmailService 发送 → 写回状态
 *  - 重试失败任务（retryFailedTasks）
 *  - 回收僵尸 running 任务（recoverStaleRunningTasks）
 *  - 与内存调度器联动（成功完成的 scheduled 任务从内存 Map 移除等）
 */

import { BaseService } from '@/server/service/baseService'
import {
  calculateTaskNextExecutionTime,
  getClaimAllowedStatuses,
  TaskStatus,
  TaskType,
  type TaskStatusValue
} from '../domain/scheduledEmailDomain'
import { ScheduledEmailMapper } from '../mapper/scheduledEmailMapper'
import { removeScheduledEmailJob, upsertScheduledEmailJob } from '../scheduler/scheduledEmailScheduler'
import { getScheduledEmailLogService, ScheduledEmailLogService } from './scheduledEmailLogService'
import { getSendEmailService, SendEmailService } from './sendEmailService'
import dayjs from 'dayjs'

const logger = new Logger({ fileName: 'scheduled-email-executor', folderName: 'server' })

/**
 * @desc 把 DAO 数据转换为内存调度器/Vo 视图所需的形态
 * @description Executor 内部需要在回收成功后重新把任务加入调度器，调度器消费的是 Vo 形态
 */
const convertDaoToVoForScheduler = (
  record: ScheduledEmailDao.ScheduledEmailOptions
): ScheduledEmailVo.ScheduledEmailOptions => ({
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
})

/**
 * @desc 定时邮件任务执行器
 */
export class ScheduledEmailExecutorService extends BaseService {
  private scheduledEmailMapper: ScheduledEmailMapper
  private scheduledEmailLogService: ScheduledEmailLogService
  private sendEmailService: SendEmailService

  constructor() {
    super()
    this.scheduledEmailMapper = new ScheduledEmailMapper()
    this.scheduledEmailLogService = getScheduledEmailLogService()
    this.sendEmailService = getSendEmailService()
  }

  /**
   * @desc 立即执行指定任务（API 触发：手动执行 / 测试执行）
   */
  async executeTask(executeOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const taskRecord = await this.scheduledEmailMapper.getScheduledEmailTask({ id: executeOptions.id })
      if (!taskRecord) {
        throw new Error('任务不存在')
      }

      if (taskRecord.status !== TaskStatus.Pending && taskRecord.status !== TaskStatus.Failed) {
        throw new Error('只有待执行或失败的任务可以立即执行')
      }

      return await this.processTask(taskRecord)
    } catch (error) {
      logger.error(`立即执行任务失败: ${executeOptions.id}, ${error}`)
      throw error
    }
  }

  /**
   * @desc 根据查询条件触发执行（调度器回调使用，容错版：失败返回 false）
   */
  async executeTaskWithOptions(queryOptions: ScheduledEmailDto.ScheduledEmailQueryOptions): Promise<boolean> {
    try {
      const taskQuery: ScheduledEmailDao.ScheduledEmailQueryOptions = {
        id: queryOptions.id,
        taskName: queryOptions.taskName,
        status: queryOptions.status,
        taskType: queryOptions.taskType,
        isActive: queryOptions.isActive,
        createdBy: queryOptions.createdBy,
        updatedBy: queryOptions.updatedBy,
        minRetryCount: queryOptions.minRetryCount,
        maxRetryCount: queryOptions.maxRetryCount,
        maxRetries: queryOptions.maxRetries,
        remarkKeyword: queryOptions.remarkKeyword,
        scheduleTimeStart: queryOptions.scheduleTimeStart,
        scheduleTimeEnd: queryOptions.scheduleTimeEnd,
        nextExecutionTimeStart: queryOptions.nextExecutionTimeStart,
        nextExecutionTimeEnd: queryOptions.nextExecutionTimeEnd
      }
      const taskRecord = await this.scheduledEmailMapper.getScheduledEmailTask(taskQuery)
      if (!taskRecord) {
        throw new Error('任务不存在')
      }

      if (!taskRecord.isActive) {
        logger.warn(`任务 ${taskRecord.id} 未激活，跳过执行`)
        return false
      }

      return await this.processTask(taskRecord)
    } catch (error) {
      logger.error(`执行任务失败: ${JSON.stringify(queryOptions)}, ${error}`)
      return false
    }
  }

  /**
   * @desc 重试所有可重试的失败任务
   */
  async retryFailedTasks(): Promise<void> {
    try {
      const retryableTaskRecordList = await this.scheduledEmailMapper.getRetryableTasks()
      logger.info(`发现 ${retryableTaskRecordList.length} 个可重试的任务`)
      for (const taskRecord of retryableTaskRecordList) {
        await this.processTask(taskRecord)
      }
    } catch (error) {
      logger.error(`重试失败任务失败: ${error}`)
    }
  }

  /**
   * @desc 回收卡在 running 状态超过阈值的"僵尸任务"
   * @description
   *  触发场景：claimTaskForExecution 抢占成功后，进程因崩溃 / OOM / SIGKILL / 容器重启等原因
   *           未能写回最终状态，导致任务永远停留在 running 状态，再也不会被调度。
   *
   *  回收策略：
   *    - 重试次数未达上限：状态置为 failed、retry_count + 1，等待 retryFailedTasks 周期重试
   *    - 已达上限：
   *        - recurring 任务：置为 pending、retry_count 归零、重算 nextExecutionTime，
   *                         保持后续周期可继续触发（与 processTask 失败超限策略一致）
   *        - scheduled 任务：保持 failed，不再自动重试（需人工介入）
   *
   *  对 release 失败（说明任务已被正常完成 / 状态已变化）的情况会自动跳过，避免覆盖。
   *
   * @param thresholdMinutes 卡死阈值（分钟）
   * @returns 实际回收的任务数
   */
  async recoverStaleRunningTasks(thresholdMinutes: number): Promise<number> {
    try {
      const staleTaskList = await this.scheduledEmailMapper.findStaleRunningTasks(thresholdMinutes)
      if (staleTaskList.length === 0) {
        return 0
      }

      logger.warn(`检测到 ${staleTaskList.length} 个卡死(running)任务，开始回收，阈值=${thresholdMinutes}分钟`)

      let recoveredCount = 0

      for (const staleTask of staleTaskList) {
        const newRetryCount = staleTask.retryCount + 1
        const reachedMaxRetries = newRetryCount >= staleTask.maxRetries

        let finalStatus: TaskStatusValue
        let persistedRetryCount: number
        let nextExecutionTime: string | null = staleTask.nextExecutionTime || null

        if (staleTask.taskType === TaskType.Recurring && reachedMaxRetries) {
          finalStatus = TaskStatus.Pending
          persistedRetryCount = 0
          nextExecutionTime = calculateTaskNextExecutionTime({
            taskType: staleTask.taskType,
            recurringDays: staleTask.recurringDays,
            recurringTime: staleTask.recurringTime
          })
        } else {
          finalStatus = TaskStatus.Failed
          persistedRetryCount = newRetryCount
        }

        const released = await this.scheduledEmailMapper.releaseStaleRunningTask({
          id: staleTask.id,
          status: finalStatus,
          errorMessage: `任务执行超时被自动回收（卡在 running 状态超过 ${thresholdMinutes} 分钟，可能由进程异常退出引起）`,
          retryCount: persistedRetryCount,
          nextExecutionTime
        })

        if (!released) {
          logger.info(`任务 ${staleTask.id} 在回收窗口期内状态已变化，跳过`)
          continue
        }

        recoveredCount += 1
        logger.warn(
          `任务已回收: id=${staleTask.id}, name=${staleTask.taskName}, ` +
            `回收后状态=${finalStatus}, retry_count=${persistedRetryCount}/${staleTask.maxRetries}`
        )

        await this.scheduledEmailLogService
          .logTaskFailure(
            staleTask.id,
            dayjs().format('YYYY-MM-DD HH:mm:ss'),
            '任务卡死被自动回收',
            0,
            '任务执行超时',
            {
              ...this.scheduledEmailLogService.buildTaskBaseMetadata(
                staleTask.emailConfig,
                staleTask.analyzeOptions,
                persistedRetryCount
              ),
              providerResponse: `running 状态持续超过 ${thresholdMinutes} 分钟`,
              rawResponsePayload: {
                recovered: true,
                originalStatus: 'running',
                recoveredTo: finalStatus,
                thresholdMinutes
              }
            }
          )
          .catch((logError) => logger.error(`记录回收日志失败: ${staleTask.id}, ${logError}`))

        if (finalStatus === TaskStatus.Pending) {
          const refreshedTask = await this.scheduledEmailMapper.getScheduledEmailTask({ id: staleTask.id })
          if (refreshedTask) {
            upsertScheduledEmailJob(convertDaoToVoForScheduler(refreshedTask))
          }
        }
      }

      logger.info(`本次共回收 ${recoveredCount}/${staleTaskList.length} 个僵尸任务`)
      return recoveredCount
    } catch (error) {
      logger.error(`回收僵尸任务失败: ${error}`)
      return 0
    }
  }

  /**
   * @desc 任务执行核心流程
   *  1. 原子抢占（claimTaskForExecution，UPDATE 行锁）
   *  2. 重读最新数据
   *  3. 调用 SendEmailService 发送
   *  4. 成功 → 更新状态 + 计算 nextExecutionTime + 日志
   *  5. 失败 → retry_count + 1 / failed；若 recurring 超过 maxRetries 则归零并进入下一周期
   *
   * @returns 是否最终发送成功
   */
  private async processTask(taskRecord: ScheduledEmailDao.ScheduledEmailOptions): Promise<boolean> {
    const startTime = Date.now()
    let success = false
    let errorMessage = ''

    const allowedStatuses = getClaimAllowedStatuses(taskRecord.taskType)
    const claimed = await this.scheduledEmailMapper.claimTaskForExecution(taskRecord.id, allowedStatuses)
    if (!claimed) {
      logger.warn(`任务 ${taskRecord.id} 未抢占到执行权，跳过本次执行`)
      return false
    }

    const latestTaskRecord = await this.scheduledEmailMapper.getScheduledEmailTask({ id: taskRecord.id })
    if (!latestTaskRecord) {
      logger.error(`任务 ${taskRecord.id} 抢占成功后未能重新读取任务详情`)
      return false
    }

    const { updatedBy, updateTime } = await super.getDefaultInfo()
    const emailConfig = latestTaskRecord.emailConfig
    const analyzeOptions = latestTaskRecord.analyzeOptions

    try {
      const expectedExecutionTime =
        latestTaskRecord.taskType === TaskType.Recurring
          ? latestTaskRecord.nextExecutionTime || latestTaskRecord.scheduleTime
          : latestTaskRecord.scheduleTime
      const now = new Date()
      const scheduleTime = expectedExecutionTime ? new Date(expectedExecutionTime) : now
      const timeDiff = now.getTime() - scheduleTime.getTime()

      if (timeDiff > 0) {
        logger.warn(`任务 ${taskRecord.id} 延迟执行 ${timeDiff}ms`)
      } else if (timeDiff < -1000) {
        logger.warn(`任务 ${taskRecord.id} 提前执行 ${Math.abs(timeDiff)}ms`)
      }

      const baseLogMetadata = this.scheduledEmailLogService.buildTaskBaseMetadata(
        emailConfig,
        analyzeOptions,
        latestTaskRecord.retryCount
      )

      const result = await this.sendEmailService.sendMail({
        emailConfig: {
          to: Array.isArray(emailConfig.to) ? emailConfig.to[0] : emailConfig.to,
          subject: emailConfig.subject,
          additionalContent: emailConfig.additionalContent || ''
        },
        analyzeOptions: { ...analyzeOptions }
      })

      const nextExecutionTime =
        latestTaskRecord.taskType === TaskType.Recurring
          ? calculateTaskNextExecutionTime({
              taskType: latestTaskRecord.taskType,
              recurringDays: latestTaskRecord.recurringDays,
              recurringTime: latestTaskRecord.recurringTime
            })
          : null

      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...latestTaskRecord,
        id: latestTaskRecord.id,
        status: latestTaskRecord.taskType === TaskType.Recurring ? TaskStatus.Pending : TaskStatus.Completed,
        nextExecutionTime,
        errorMessage: undefined,
        retryCount: 0,
        executedTime: updateTime,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      await this.scheduledEmailLogService.logTaskSuccess(
        latestTaskRecord.id,
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
        result.messageId,
        Date.now() - startTime,
        '邮件发送成功',
        this.scheduledEmailLogService.enrichSendResultMetadata(baseLogMetadata, result)
      )

      success = true
      if (latestTaskRecord.taskType === TaskType.Scheduled) {
        removeScheduledEmailJob(latestTaskRecord.id)
      }
      logger.info(`任务执行成功: ${latestTaskRecord.id}, messageId: ${result.messageId}`)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : '未知错误'

      const newRetryCount = latestTaskRecord.retryCount + 1
      const recurringReachedMaxRetries =
        latestTaskRecord.taskType === TaskType.Recurring && newRetryCount >= latestTaskRecord.maxRetries
      const nextExecutionTime = recurringReachedMaxRetries
        ? calculateTaskNextExecutionTime({
            taskType: latestTaskRecord.taskType,
            recurringDays: latestTaskRecord.recurringDays,
            recurringTime: latestTaskRecord.recurringTime
          })
        : latestTaskRecord.nextExecutionTime || null
      const status: TaskStatusValue = recurringReachedMaxRetries ? TaskStatus.Pending : TaskStatus.Failed
      const persistedRetryCount = recurringReachedMaxRetries ? 0 : newRetryCount

      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...latestTaskRecord,
        id: latestTaskRecord.id,
        status,
        nextExecutionTime,
        errorMessage: errorMessage,
        retryCount: persistedRetryCount,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      await this.scheduledEmailLogService.logTaskFailure(
        latestTaskRecord.id,
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
        errorMessage,
        Date.now() - startTime,
        '邮件发送失败',
        {
          ...this.scheduledEmailLogService.buildTaskBaseMetadata(emailConfig, analyzeOptions, newRetryCount),
          providerResponse: errorMessage,
          rawResponsePayload: { error: errorMessage }
        }
      )

      logger.error(
        `任务执行失败: ${latestTaskRecord.id}, 重试次数: ${newRetryCount}/${latestTaskRecord.maxRetries}, 错误: ${errorMessage}`
      )
    }

    return success
  }
}

/* ============================== 单例工厂 ============================== */

let scheduledEmailExecutorServiceInstance: ScheduledEmailExecutorService | null = null

/**
 * @desc 获取 ScheduledEmailExecutorService 的进程级单例
 */
export const getScheduledEmailExecutorService = (): ScheduledEmailExecutorService => {
  if (!scheduledEmailExecutorServiceInstance) {
    scheduledEmailExecutorServiceInstance = new ScheduledEmailExecutorService()
  }
  return scheduledEmailExecutorServiceInstance
}
