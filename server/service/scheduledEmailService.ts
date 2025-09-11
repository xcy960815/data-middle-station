import { ScheduledEmailMapper } from '../mapper/scheduledEmailMapper'
import { BaseService } from './baseService'
import { ScheduledEmailLogService } from './scheduledEmailLogService'
import { SendEmailService } from './sendEmailService'

const logger = new Logger({ fileName: 'scheduled-email', folderName: 'server' })

/**
 * 定时邮件服务
 */
export class ScheduledEmailService extends BaseService {
  private scheduledEmailMapper: ScheduledEmailMapper
  private sendEmailService: SendEmailService
  private scheduledEmailLogService: ScheduledEmailLogService

  constructor() {
    super()
    this.scheduledEmailMapper = new ScheduledEmailMapper()
    this.sendEmailService = new SendEmailService()
    this.scheduledEmailLogService = new ScheduledEmailLogService()
  }

  /**
   * 创建定时邮件任务
   */
  async createScheduledEmail(scheduledEmailOptions: ScheduledEmailDto.CreateScheduledEmailOptions): Promise<boolean> {
    try {
      // 验证执行时间
      const scheduleTime = new Date(scheduledEmailOptions.scheduleTime)

      const now = new Date()

      if (scheduleTime <= now) {
        throw new Error('执行时间必须大于当前时间')
      }

      const { createdBy, updatedBy, createTime, updateTime } = await super.getDefaultInfo()

      // 构建数据库参数
      const createParams: ScheduledEmailDao.ScheduledEmailOptions = {
        id: 0, // 临时值，数据库会自动生成
        taskName: scheduledEmailOptions.taskName,
        scheduleTime: scheduledEmailOptions.scheduleTime,
        emailConfig: JSON.stringify(scheduledEmailOptions.emailConfig),
        analyseOptions: JSON.stringify(scheduledEmailOptions.analyseOptions),
        status: 'pending',
        remark: scheduledEmailOptions.remark,
        createdTime: createTime,
        updatedTime: updateTime,
        executedTime: undefined,
        errorMessage: undefined,
        retryCount: 0,
        maxRetries: scheduledEmailOptions.maxRetries || 3,
        createdBy: createdBy,
        updatedBy: updatedBy
      }

      // 创建任务
      const taskId = await this.scheduledEmailMapper.createScheduledEmailTask(createParams)

      logger.info(`定时邮件任务创建成功: ${taskId}`)

      return taskId > 0
    } catch (error) {
      logger.error(`创建定时邮件任务失败: ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务详情
   */
  async getScheduledEmail(
    scheduledEmailOptions: ScheduledEmailDto.UpdateScheduledEmailOptions
  ): Promise<ScheduledEmailDto.ScheduledEmailOptions | null> {
    const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailOptions.id)
    return scheduledEmailTask ? this.convertDaoToDto(scheduledEmailTask) : null
  }

  /**
   * 更新定时邮件任务
   */
  async updateScheduledEmail(scheduledEmailOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      // 验证任务是否存在
      const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailOptions.id)
      if (!scheduledEmailTask) {
        throw new Error('任务不存在')
      }

      // 验证任务状态 - 只有pending和failed状态的任务可以编辑
      if (!['pending', 'failed'].includes(scheduledEmailTask.status)) {
        throw new Error('只有待执行或失败的任务可以编辑')
      }

      // 如果更新执行时间，验证时间
      if (scheduledEmailOptions.scheduleTime) {
        const scheduleTime = new Date(scheduledEmailOptions.scheduleTime)
        const now = new Date()

        if (scheduleTime <= now) {
          throw new Error('执行时间必须大于当前时间')
        }
      }

      const { updatedBy, updateTime } = await super.getDefaultInfo()

      // 构建更新参数
      const updateParams: ScheduledEmailDao.ScheduledEmailOptions = {
        ...scheduledEmailTask,
        id: scheduledEmailOptions.id,
        taskName: scheduledEmailOptions.taskName || scheduledEmailTask.taskName,
        scheduleTime: scheduledEmailOptions.scheduleTime || scheduledEmailTask.scheduleTime,
        emailConfig: scheduledEmailOptions.emailConfig
          ? JSON.stringify({
              ...JSON.parse(scheduledEmailTask.emailConfig),
              ...scheduledEmailOptions.emailConfig
            })
          : scheduledEmailTask.emailConfig,
        analyseOptions: scheduledEmailOptions.analyseOptions
          ? JSON.stringify({
              ...JSON.parse(scheduledEmailTask.analyseOptions),
              ...scheduledEmailOptions.analyseOptions
            })
          : scheduledEmailTask.analyseOptions,
        status: scheduledEmailOptions.status || scheduledEmailTask.status,
        remark: scheduledEmailOptions.remark !== undefined ? scheduledEmailOptions.remark : scheduledEmailTask.remark,
        maxRetries:
          scheduledEmailOptions.maxRetries !== undefined
            ? scheduledEmailOptions.maxRetries
            : scheduledEmailTask.maxRetries,
        updatedTime: updateTime,
        updatedBy: updatedBy
      }

      // 如果状态改为pending，重置错误信息和重试次数
      if (
        (scheduledEmailOptions.status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled') === 'pending'
      ) {
        updateParams.errorMessage = undefined
        updateParams.retryCount = 0
      }

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask(updateParams)

      return success
    } catch (error) {
      logger.error(`更新定时邮件任务失败: ${scheduledEmailOptions.id}, ${error}`)
      throw error
    }
  }

  /**
   * 删除定时邮件任务
   */
  async deleteScheduledEmail(scheduledEmailOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      // 验证任务是否存在
      const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailOptions.id)
      if (!scheduledEmailTask) {
        throw new Error('任务不存在')
      }

      // 验证任务状态 - 运行中的任务不能删除
      if (scheduledEmailTask.status === 'running') {
        throw new Error('正在执行的任务不能删除')
      }

      const isDeleteSuccess = await this.scheduledEmailMapper.deleteScheduledEmailTask({ id: scheduledEmailOptions.id })

      if (isDeleteSuccess) {
        logger.info(`定时邮件任务删除成功: ${scheduledEmailOptions.id}`)
      }

      return isDeleteSuccess
    } catch (error) {
      logger.error(`删除定时邮件任务失败: ${scheduledEmailOptions.id}, ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务列表
   */
  async getScheduledEmailList(
    query: ScheduledEmailDto.ScheduledEmailListQuery
  ): Promise<ScheduledEmailDto.ScheduledEmailList> {
    try {
      const scheduledEmailList = await this.scheduledEmailMapper.getScheduledEmailList(query)
      return scheduledEmailList.map((task) => this.convertDaoToDto(task))
    } catch (error) {
      logger.error(`获取定时邮件任务列表失败: ${error}`)
      throw error
    }
  }

  /**
   * 切换任务状态（启用/禁用）
   */
  async toggleTaskStatus(scheduledEmailOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailOptions.id)
      if (!scheduledEmailTask) {
        throw new Error('任务不存在')
      }

      let newStatus: 'pending' | 'cancelled'

      if (scheduledEmailTask.status === 'pending') {
        newStatus = 'cancelled'
      } else if (scheduledEmailTask.status === 'cancelled') {
        newStatus = 'pending'
        // 验证执行时间是否仍然有效
        const scheduleTime = new Date(scheduledEmailTask.scheduleTime)
        const now = new Date()

        if (scheduleTime <= now) {
          throw new Error('任务执行时间已过期，无法启用')
        }
      } else {
        throw new Error('只有待执行或已取消的任务可以切换状态')
      }

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailTask,
        id: scheduledEmailOptions.id,
        status: newStatus,
        errorMessage: newStatus === 'pending' ? undefined : scheduledEmailTask.errorMessage,
        retryCount: newStatus === 'pending' ? 0 : scheduledEmailTask.retryCount,
        updatedTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      return success
    } catch (error) {
      logger.error(`切换任务状态失败: ${scheduledEmailOptions.id}, ${error}`)
      throw error
    }
  }

  /**
   * 立即执行任务
   */
  async executeTask(scheduledEmailOptions: ScheduledEmailDto.UpdateScheduledEmailOptions): Promise<boolean> {
    try {
      const scheduledEmailTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(scheduledEmailOptions.id)
      if (!scheduledEmailTask) {
        throw new Error('任务不存在')
      }

      if (scheduledEmailTask.status !== 'pending') {
        throw new Error('只有待执行的任务可以立即执行')
      }

      return await this.processTask(scheduledEmailTask)
    } catch (error) {
      logger.error(`立即执行任务失败: ${scheduledEmailOptions.id}, ${error}`)
      throw error
    }
  }

  /**
   * 处理待执行的任务（定时调度器调用）
   */
  async processPendingTasks(): Promise<void> {
    try {
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      const pendingTasks = await this.scheduledEmailMapper.getPendingTasks(currentTime)

      logger.info(`发现 ${pendingTasks.length} 个待执行的任务`)

      for (const task of pendingTasks) {
        await this.processTask(task)
      }
    } catch (error) {
      logger.error(`处理待执行任务失败: ${error}`)
    }
  }

  /**
   * 处理精确时间任务（秒级精度）
   */
  async processExactTimeTasks(): Promise<void> {
    try {
      const now = new Date()
      const currentTime = now.toISOString().slice(0, 19).replace('T', ' ')

      // 获取未来30秒内需要执行的任务
      const futureTime = new Date(now.getTime() + 30 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      const exactTasks = await this.scheduledEmailMapper.getExactTimeTasks(currentTime, futureTime)

      logger.info(`发现 ${exactTasks.length} 个精确时间任务`)

      for (const task of exactTasks) {
        const scheduleTime = new Date(task.scheduleTime)
        const timeDiff = scheduleTime.getTime() - now.getTime()

        // 如果任务在10秒内需要执行，立即处理
        if (timeDiff <= 10000 && timeDiff >= 0) {
          logger.info(`执行精确时间任务: ${task.id}, 时间差: ${timeDiff}ms`)
          await this.processTask(task)
        }
      }
    } catch (error) {
      logger.error(`处理精确时间任务失败: ${error}`)
    }
  }

  /**
   * 重试失败的任务
   */
  async retryFailedTasks(): Promise<void> {
    try {
      const retryableTasks = await this.scheduledEmailMapper.getRetryableTasks()

      logger.info(`发现 ${retryableTasks.length} 个可重试的任务`)

      for (const task of retryableTasks) {
        await this.processTask(task)
      }
    } catch (error) {
      logger.error(`重试失败任务失败: ${error}`)
    }
  }

  /**
   * 处理单个任务
   */
  private async processTask(scheduledEmailTask: ScheduledEmailDao.ScheduledEmailOptions): Promise<boolean> {
    const startTime = Date.now()
    let success = false
    let errorMessage = ''

    // 获取默认信息，用于整个方法
    const { updatedBy, updateTime } = await super.getDefaultInfo()

    try {
      // 计算时间补偿
      const scheduleTime = new Date(scheduledEmailTask.scheduleTime)
      const now = new Date()
      const timeDiff = now.getTime() - scheduleTime.getTime()

      // 记录时间误差
      if (timeDiff > 0) {
        logger.warn(`任务 ${scheduledEmailTask.id} 延迟执行 ${timeDiff}ms`)
      } else if (timeDiff < -1000) {
        logger.warn(`任务 ${scheduledEmailTask.id} 提前执行 ${Math.abs(timeDiff)}ms`)
      }

      // 更新任务状态为运行中
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailTask,
        id: scheduledEmailTask.id,
        status: 'running',
        executedTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 解析配置
      const emailConfig: ScheduledEmailDto.EmailConfig = JSON.parse(scheduledEmailTask.emailConfig)
      const chartData: ScheduledEmailDto.ChartData = JSON.parse(scheduledEmailTask.analyseOptions)

      // 构建邮件内容
      const htmlContent = this.buildEmailContent(emailConfig, chartData)

      // 发送邮件
      const result = await this.sendEmailService.sendMail({
        to: emailConfig.to,
        subject: emailConfig.subject,
        html: htmlContent,
        cc: emailConfig.cc,
        bcc: emailConfig.bcc,
        attachments: [
          {
            filename: chartData.filename,
            content: Buffer.from(chartData.base64Image.split(',')[1], 'base64'),
            contentType: 'image/png'
          }
        ]
      })

      // 更新任务状态为完成
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailTask,
        id: scheduledEmailTask.id,
        status: 'completed',
        errorMessage: undefined,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 记录执行日志
      await this.scheduledEmailLogService.logTaskSuccess(
        scheduledEmailTask.id,
        new Date().toISOString().slice(0, 19).replace('T', ' '),
        result.messageId,
        Date.now() - startTime,
        '邮件发送成功'
      )

      success = true
      logger.info(`任务执行成功: ${scheduledEmailTask.id}, messageId: ${result.messageId}`)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : '未知错误'

      // 增加重试次数
      const newRetryCount = scheduledEmailTask.retryCount + 1
      const status = newRetryCount >= scheduledEmailTask.maxRetries ? 'failed' : 'pending'

      // 更新任务状态
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...scheduledEmailTask,
        id: scheduledEmailTask.id,
        status,
        errorMessage: errorMessage,
        retryCount: newRetryCount,
        updatedTime: updateTime,
        updatedBy: updatedBy
      })

      // 记录执行日志
      await this.scheduledEmailLogService.logTaskFailure(
        scheduledEmailTask.id,
        new Date().toISOString().slice(0, 19).replace('T', ' '),
        errorMessage,
        Date.now() - startTime,
        '邮件发送失败'
      )

      logger.error(
        `任务执行失败: ${scheduledEmailTask.id}, 重试次数: ${newRetryCount}/${scheduledEmailTask.maxRetries}, 错误: ${errorMessage}`
      )
    }

    return success
  }

  /**
   * 构建邮件内容
   */
  private buildEmailContent(
    emailConfig: ScheduledEmailDto.EmailConfig,
    chartData: ScheduledEmailDto.ChartData
  ): string {
    const additionalContent = emailConfig.additionalContent
      ? `<div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
           <p style="margin: 0; color: #495057;">${emailConfig.additionalContent.replace(/\n/g, '<br>')}</p>
         </div>`
      : ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${emailConfig.subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; }
          .content { margin-bottom: 30px; }
          .chart-info { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📊 数据分析报告</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}</p>
          </div>

          <div class="content">
            ${additionalContent}

            <div class="chart-info">
              <h3 style="margin-top: 0; color: #495057;">📈 图表信息</h3>
              <p style="margin: 5px 0;"><strong>图表标题:</strong> ${chartData.title}</p>
              ${chartData.analyseName ? `<p style="margin: 5px 0;"><strong>分析名称:</strong> ${chartData.analyseName}</p>` : ''}
              <p style="margin: 5px 0;"><strong>生成时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
            </div>

            <p>📎 图表图片已作为附件发送，请查看附件获取高清图表。</p>
          </div>

          <div class="footer">
            <p style="margin: 0;">此邮件由数据中台自动发送，如有疑问请联系管理员。</p>
            <p style="margin: 5px 0 0 0;">🤖 定时任务系统</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * 获取任务执行日志
   */
  async getScheduledEmailLogList(taskId: number, limit: number = 20): Promise<ScheduledEmailDto.ExecutionLog[]> {
    try {
      const result = await this.scheduledEmailLogService.getExecutionLogList({
        taskId,
        limit
      })
      return result.logs.map((log) => ({
        id: log.id,
        task_id: log.taskId,
        execution_time: log.executionTime,
        status: log.status,
        error_message: log.errorDetails,
        duration: log.executionDuration,
        created_at: log.createdTime
      }))
    } catch (error) {
      logger.error(`获取任务执行日志失败: ${taskId}, ${error}`)
      throw error
    }
  }

  /**
   * 获取任务统计信息
   */
  async getScheduledEmailTaskStatistics(): Promise<ScheduledEmailDto.TaskStatistics> {
    try {
      return await this.scheduledEmailMapper.getScheduledEmailTaskStatistics()
    } catch (error) {
      logger.error(`获取任务统计信息失败: ${error}`)
      throw error
    }
  }

  /**
   * 转换DAO对象为DTO对象
   */
  private convertDaoToDto(dao: ScheduledEmailDao.ScheduledEmailOptions): ScheduledEmailDto.ScheduledEmailOptions {
    return {
      id: dao.id,
      taskName: dao.taskName,
      scheduleTime: dao.scheduleTime,
      emailConfig: JSON.parse(dao.emailConfig),
      analyseOptions: JSON.parse(dao.analyseOptions),
      status: dao.status,
      remark: dao.remark,
      createdTime: dao.createdTime,
      updatedTime: dao.updatedTime,
      executedTime: dao.executedTime,
      errorMessage: dao.errorMessage,
      retryCount: dao.retryCount,
      maxRetries: dao.maxRetries,
      createdBy: dao.createdBy,
      updatedBy: dao.updatedBy
    }
  }
}
