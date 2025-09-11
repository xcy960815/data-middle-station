import { ScheduledEmailMapper } from '../mapper/scheduledEmailMapper'

import { SendEmailService } from './sendEmailService'

const logger = new Logger({ fileName: 'scheduled-email', folderName: 'server' })

/**
 * 定时邮件服务
 */
export class ScheduledEmailService {
  private scheduledEmailMapper: ScheduledEmailMapper
  private sendEmailService: SendEmailService

  constructor() {
    this.scheduledEmailMapper = new ScheduledEmailMapper()
    this.sendEmailService = new SendEmailService()
  }

  /**
   * 创建定时邮件任务
   */
  async createScheduledEmail(
    request: ScheduledEmailDto.CreateScheduledEmailRequest
  ): Promise<ScheduledEmailDto.ScheduledEmailOption> {
    try {
      // 验证执行时间
      const scheduleTime = new Date(request.scheduleTime)

      const now = new Date()

      if (scheduleTime <= now) {
        throw new Error('执行时间必须大于当前时间')
      }

      // 构建数据库参数
      const createParams: ScheduledEmailDao.ScheduledEmailOptions = {
        id: 0, // 临时值，数据库会自动生成
        taskName: request.taskName,
        scheduleTime: request.scheduleTime,
        emailConfig: JSON.stringify(request.emailConfig),
        chartData: JSON.stringify(request.chartData),
        status: 'pending',
        remark: request.remark,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        executedAt: undefined,
        errorMessage: undefined,
        retryCount: 0,
        maxRetries: request.maxRetries || 3
      }

      // 创建任务
      const taskId = await this.scheduledEmailMapper.createScheduledEmailTask(createParams)

      logger.info(`定时邮件任务创建成功: ${taskId}`)

      // 获取创建的任务
      const task = await this.scheduledEmailMapper.getScheduledEmailTaskById(taskId)
      return this.convertDaoToDto(task)
    } catch (error) {
      logger.error(`创建定时邮件任务失败: ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务详情
   */
  async getScheduledEmail(id: number): Promise<ScheduledEmailDto.ScheduledEmailOption | null> {
    try {
      const task = await this.scheduledEmailMapper.getScheduledEmailTaskById(id)
      return task ? this.convertDaoToDto(task) : null
    } catch (error) {
      logger.error(`获取定时邮件任务失败: ${id}, ${error}`)
      throw error
    }
  }

  /**
   * 更新定时邮件任务
   */
  async updateScheduledEmail(id: number, request: ScheduledEmailDto.UpdateScheduledEmailRequest): Promise<boolean> {
    try {
      // 验证任务是否存在
      const existingTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(id)
      if (!existingTask) {
        throw new Error('任务不存在')
      }

      // 验证任务状态 - 只有pending和failed状态的任务可以编辑
      if (!['pending', 'failed'].includes(existingTask.status)) {
        throw new Error('只有待执行或失败的任务可以编辑')
      }

      // 如果更新执行时间，验证时间
      if (request.scheduleTime) {
        const scheduleTime = new Date(request.scheduleTime)
        const now = new Date()

        if (scheduleTime <= now) {
          throw new Error('执行时间必须大于当前时间')
        }
      }

      // 构建更新参数
      const updateParams: ScheduledEmailDao.ScheduledEmailOptions = {
        ...existingTask,
        id,
        taskName: request.taskName || existingTask.taskName,
        scheduleTime: request.scheduleTime || existingTask.scheduleTime,
        emailConfig: request.emailConfig
          ? JSON.stringify({
              ...JSON.parse(existingTask.emailConfig),
              ...request.emailConfig
            })
          : existingTask.emailConfig,
        chartData: request.chartData
          ? JSON.stringify({
              ...JSON.parse(existingTask.chartData),
              ...request.chartData
            })
          : existingTask.chartData,
        status: request.status || existingTask.status,
        remark: request.remark !== undefined ? request.remark : existingTask.remark,
        maxRetries: request.maxRetries !== undefined ? request.maxRetries : existingTask.maxRetries,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }

      // 如果状态改为pending，重置错误信息和重试次数
      if (request.status === 'pending') {
        updateParams.errorMessage = undefined
        updateParams.retryCount = 0
      }

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask(updateParams)

      if (success) {
        logger.info(`定时邮件任务更新成功: ${id}`)
      }

      return success
    } catch (error) {
      logger.error(`更新定时邮件任务失败: ${id}, ${error}`)
      throw error
    }
  }

  /**
   * 删除定时邮件任务
   */
  async deleteScheduledEmail(id: number): Promise<boolean> {
    try {
      // 验证任务是否存在
      const existingTask = await this.scheduledEmailMapper.getScheduledEmailTaskById(id)
      if (!existingTask) {
        throw new Error('任务不存在')
      }

      // 验证任务状态 - 运行中的任务不能删除
      if (existingTask.status === 'running') {
        throw new Error('正在执行的任务不能删除')
      }

      const success = await this.scheduledEmailMapper.deleteScheduledEmailTask({ id })

      if (success) {
        logger.info(`定时邮件任务删除成功: ${id}`)
      }

      return success
    } catch (error) {
      logger.error(`删除定时邮件任务失败: ${id}, ${error}`)
      throw error
    }
  }

  /**
   * 获取定时邮件任务列表
   */
  async getScheduledEmailList(
    query: ScheduledEmailDto.ScheduledEmailListQuery
  ): Promise<ScheduledEmailDto.ScheduledEmailListResponse> {
    try {
      const tasksList = await this.scheduledEmailMapper.getScheduledEmailList(query)
      return tasksList.map((task) => this.convertDaoToDto(task))
    } catch (error) {
      logger.error(`获取定时邮件任务列表失败: ${error}`)
      throw error
    }
  }

  /**
   * 切换任务状态（启用/禁用）
   */
  async toggleTaskStatus(id: number): Promise<boolean> {
    try {
      const task = await this.scheduledEmailMapper.getScheduledEmailTaskById(id)
      if (!task) {
        throw new Error('任务不存在')
      }

      let newStatus: 'pending' | 'cancelled'

      if (task.status === 'pending') {
        newStatus = 'cancelled'
      } else if (task.status === 'cancelled') {
        newStatus = 'pending'
        // 验证执行时间是否仍然有效
        const scheduleTime = new Date(task.scheduleTime)
        const now = new Date()

        if (scheduleTime <= now) {
          throw new Error('任务执行时间已过期，无法启用')
        }
      } else {
        throw new Error('只有待执行或已取消的任务可以切换状态')
      }

      const success = await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...task,
        id,
        status: newStatus,
        errorMessage: newStatus === 'pending' ? undefined : task.errorMessage,
        retryCount: newStatus === 'pending' ? 0 : task.retryCount,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      if (success) {
        logger.info(`任务状态切换成功: ${id} -> ${newStatus}`)
      }

      return success
    } catch (error) {
      logger.error(`切换任务状态失败: ${id}, ${error}`)
      throw error
    }
  }

  /**
   * 立即执行任务
   */
  async executeTask(id: number): Promise<boolean> {
    try {
      const task = await this.scheduledEmailMapper.getScheduledEmailTaskById(id)
      if (!task) {
        throw new Error('任务不存在')
      }

      if (task.status !== 'pending') {
        throw new Error('只有待执行的任务可以立即执行')
      }

      return await this.processTask(task)
    } catch (error) {
      logger.error(`立即执行任务失败: ${id}, ${error}`)
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
  private async processTask(task: ScheduledEmailDao.ScheduledEmailOptions): Promise<boolean> {
    const startTime = Date.now()
    let success = false
    let errorMessage = ''

    try {
      // 计算时间补偿
      const scheduleTime = new Date(task.scheduleTime)
      const now = new Date()
      const timeDiff = now.getTime() - scheduleTime.getTime()

      // 记录时间误差
      if (timeDiff > 0) {
        logger.warn(`任务 ${task.id} 延迟执行 ${timeDiff}ms`)
      } else if (timeDiff < -1000) {
        logger.warn(`任务 ${task.id} 提前执行 ${Math.abs(timeDiff)}ms`)
      }

      // 更新任务状态为运行中
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...task,
        id: task.id,
        status: 'running',
        executedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      // 解析配置
      const emailConfig: ScheduledEmailDto.EmailConfig = JSON.parse(task.emailConfig)
      const chartData: ScheduledEmailDto.ChartData = JSON.parse(task.chartData)

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
        ...task,
        id: task.id,
        status: 'completed',
        errorMessage: undefined,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      // 记录执行日志
      await this.scheduledEmailMapper.createScheduledEmailLog({
        id: 0, // 临时值，数据库会自动生成
        taskId: task.id,
        executionTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        status: 'success',
        message: '邮件发送成功',
        errorDetails: undefined,
        emailMessageId: result.messageId,
        executionDuration: Date.now() - startTime,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      success = true
      logger.info(`任务执行成功: ${task.id}, messageId: ${result.messageId}`)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : '未知错误'

      // 增加重试次数
      const newRetryCount = task.retryCount + 1
      const status = newRetryCount >= task.maxRetries ? 'failed' : 'pending'

      // 更新任务状态
      await this.scheduledEmailMapper.updateScheduledEmailTask({
        ...task,
        id: task.id,
        status,
        errorMessage: errorMessage,
        retryCount: newRetryCount,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      // 记录执行日志
      await this.scheduledEmailMapper.createScheduledEmailLog({
        id: 0, // 临时值，数据库会自动生成
        taskId: task.id,
        executionTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        status: 'failed',
        message: '邮件发送失败',
        errorDetails: errorMessage,
        emailMessageId: undefined,
        executionDuration: Date.now() - startTime,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })

      logger.error(`任务执行失败: ${task.id}, 重试次数: ${newRetryCount}/${task.maxRetries}, 错误: ${errorMessage}`)
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
      const logs = await this.scheduledEmailMapper.getScheduledEmailLogList(taskId, limit)
      return logs.map((log) => ({
        id: log.id,
        task_id: log.taskId,
        execution_time: log.executionTime,
        status: log.status,
        error_message: log.errorDetails,
        duration: log.executionDuration,
        created_at: log.createdAt || log.executionTime
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
  private convertDaoToDto(dao: ScheduledEmailDao.ScheduledEmailOptions): ScheduledEmailDto.ScheduledEmailOption {
    return {
      id: dao.id,
      taskName: dao.taskName,
      scheduleTime: dao.scheduleTime,
      emailConfig: JSON.parse(dao.emailConfig),
      chartData: JSON.parse(dao.chartData),
      status: dao.status,
      remark: dao.remark,
      createdAt: dao.createdAt,
      updatedAt: dao.updatedAt,
      executedAt: dao.executedAt,
      errorMessage: dao.errorMessage,
      retryCount: dao.retryCount,
      maxRetries: dao.maxRetries
    }
  }
}
