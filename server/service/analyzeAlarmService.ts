import { AnalyzeAlarmMapper } from '@/server/mapper/analyzeAlarmMapper'
import { AnalyzeService } from '@/server/service/analyzeService'
import { ChartDataService } from '@/server/service/chartDataService'
import { BaseService } from '@/server/service/baseService'
import { resolveAnalyzeDrillQueryFields } from '@/shared/analyzeDrillState'
import { validateAnalyzeChartConfig } from '@/utils/validateAnalyzeChartConfig'
import { Logger } from '@/server/utils/logger'

const logger = new Logger({ fileName: 'analyze-alarm-service', folderName: 'server' })

export class AnalyzeAlarmService extends BaseService {
  private analyzeAlarmMapper: AnalyzeAlarmMapper
  private analyzeService: AnalyzeService
  private chartDataService: ChartDataService

  constructor() {
    super()
    this.analyzeAlarmMapper = new AnalyzeAlarmMapper()
    this.analyzeService = new AnalyzeService()
    this.chartDataService = new ChartDataService()
  }

  public async getAlarms(params: AnalyzeAlarmDao.GetAnalyzeAlarmParams) {
    return await this.analyzeAlarmMapper.getAnalyzeAlarms(params)
  }

  public async getAlarmById(id: number) {
    return await this.analyzeAlarmMapper.getAnalyzeAlarmById(id)
  }

  public async createAlarm(params: Omit<AnalyzeAlarmDao.CreateAnalyzeAlarmParams, 'createdBy' | 'updatedBy'>) {
    const { createdBy, updatedBy } = await this.getDefaultInfo()
    const id = await this.analyzeAlarmMapper.createAnalyzeAlarm({
      ...params,
      createdBy,
      updatedBy
    })
    if (id > 0) {
      const alarm = await this.getAlarmById(id)
      if (alarm) {
        import('@/server/plugins/analyze-alarm-scheduler').then((mod) => {
          mod.upsertAlarmJob(alarm)
        })
      }
    }
    return id
  }

  public async updateAlarm(params: Omit<AnalyzeAlarmDao.UpdateAnalyzeAlarmParams, 'updatedBy'>) {
    const { updatedBy } = await this.getDefaultInfo()
    const success = await this.analyzeAlarmMapper.updateAnalyzeAlarm({
      ...params,
      updatedBy
    })
    if (success && params.id) {
      const alarm = await this.getAlarmById(params.id)
      if (alarm) {
        import('@/server/plugins/analyze-alarm-scheduler').then((mod) => {
          mod.upsertAlarmJob(alarm)
        })
      }
    }
    return success
  }

  public async deleteAlarm(id: number) {
    return await this.analyzeAlarmMapper.deleteAnalyzeAlarm(id)
  }

  public async getAlarmLogs(alarmId: number) {
    return await this.analyzeAlarmMapper.getAnalyzeAlarmLogs(alarmId)
  }

  public async toggleAlarmStatus(id: number) {
    const alarm = await this.getAlarmById(id)
    if (!alarm) throw new Error('报警规则不存在')
    return await this.updateAlarm({ id, isActive: alarm.isActive ? 0 : 1 })
  }

  public async evaluateAlarm(alarm: AnalyzeAlarmDao.AnalyzeAlarmRecord): Promise<void> {
    const executeTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
    let isTriggered = 0
    let notifyStatus = 'skipped'
    let errorMessage = ''
    let triggerDetail: any = null

    try {
      const analyzeVo = await this.analyzeService.getAnalyze({ id: alarm.analyzeId })
      if (!analyzeVo || !analyzeVo.chartConfig) {
        throw new Error(`分析图表不存在或缺少配置 (ID: ${alarm.analyzeId})`)
      }

      const chartConfig = analyzeVo.chartConfig
      const drillQueryFields = resolveAnalyzeDrillQueryFields({
        dimensions: chartConfig.dimensions || [],
        filters: chartConfig.filters || []
      })

      const validation = validateAnalyzeChartConfig({
        chartType: chartConfig.chartType,
        datasetId: chartConfig.datasetId,
        measures: chartConfig.measures || [],
        dimensions: drillQueryFields.dimensions
      })
      if (!validation.valid) {
        throw new Error(`分析图表配置无效: ${validation.message}`)
      }

      // 获取数据
      const analyzeData = await this.chartDataService.getAnalyzeData({
        analyzeId: alarm.analyzeId,
        filters: drillQueryFields.filters,
        orders: chartConfig.orders || [],
        dimensions: drillQueryFields.dimensions,
        measures: chartConfig.measures,
        datasetId: chartConfig.datasetId!,
        commonChartConfig: chartConfig.commonChartConfig
      })

      // 评估条件
      const { met, detail } = this.checkConditions(analyzeData, alarm.conditions)
      isTriggered = met ? 1 : 0
      triggerDetail = detail

      if (met) {
        const shouldNotify = await this.checkAlarmStrategy(alarm)
        if (shouldNotify) {
          await this.sendNotification(alarm, analyzeVo.analyzeName, detail)
          notifyStatus = 'success'
          // 更新上次触发时间
          await this.analyzeAlarmMapper.updateAnalyzeAlarm({
            id: alarm.id,
            lastTriggeredTime: executeTime
          })
        }
      }
    } catch (err: any) {
      logger.error(`执行报警检查失败 (Alarm ID: ${alarm.id}): ${err.message}`)
      notifyStatus = 'failed'
      errorMessage = err.message
    }

    // 写入日志
    await this.analyzeAlarmMapper.createAnalyzeAlarmLog({
      alarmId: alarm.id,
      executeTime,
      isTriggered,
      triggerDetail,
      notifyStatus,
      errorMessage
    })
  }

  private checkConditions(data: Array<AnalyzeDataVo.AnalyzeData>, conditions: AnalyzeAlarmDao.AlarmCondition[]) {
    // 简化逻辑：只要数据中有任何一行满足所有条件，即视为触发
    if (!data || data.length === 0) return { met: false, detail: null }

    for (const row of data) {
      let allMet = true
      for (const cond of conditions) {
        const val = Number(row[cond.measureId])
        if (isNaN(val)) {
          allMet = false
          break
        }
        const threshold = Number(cond.threshold)
        let condMet = false
        switch (cond.operator) {
          case '>':
            condMet = val > threshold
            break
          case '<':
            condMet = val < threshold
            break
          case '=':
            condMet = val === threshold
            break
          case '>=':
            condMet = val >= threshold
            break
          case '<=':
            condMet = val <= threshold
            break
          case '!=':
            condMet = val !== threshold
            break
        }
        if (!condMet) {
          allMet = false
          break
        }
      }
      if (allMet) {
        return { met: true, detail: row } // 返回触发的这一行数据
      }
    }
    return { met: false, detail: null }
  }

  private async checkAlarmStrategy(alarm: AnalyzeAlarmDao.AnalyzeAlarmRecord): Promise<boolean> {
    if (alarm.alarmStrategy === 'always') return true

    if (!alarm.lastTriggeredTime) return true

    const lastTrigger = new Date(alarm.lastTriggeredTime).getTime()
    const now = new Date().getTime()

    if (alarm.alarmStrategy === 'once_per_day') {
      // 距离上次触发超过 24 小时
      return now - lastTrigger > 24 * 60 * 60 * 1000
    }

    if (alarm.alarmStrategy === 'only_state_change') {
      const logs = await this.analyzeAlarmMapper.getAnalyzeAlarmLogs(alarm.id)
      if (!logs || logs.length === 0) return true
      const lastMet = logs[0].isTriggered === 1
      // 当前一定为触发状态，如果上一次未触发，说明状态发生了变化
      return !lastMet
    }

    return true
  }

  private async sendNotification(alarm: AnalyzeAlarmDao.AnalyzeAlarmRecord, analyzeName: string, detail: any) {
    const config = alarm.notificationConfig
    if (config.emails && config.emails.length > 0) {
      // TODO: 集成真实的邮件发送服务 (可借鉴 EmailService)
      logger.info(
        `触发报警 [${alarm.alarmName}] - 图表 [${analyzeName}], 发送邮件至: ${config.emails.join(', ')}. 详情: ${JSON.stringify(detail)}`
      )
    }
    if (config.webhookUrl) {
      logger.info(`触发报警 [${alarm.alarmName}] - 图表 [${analyzeName}], 请求 Webhook: ${config.webhookUrl}`)
    }
  }
}

let analyzeAlarmServiceInstance: AnalyzeAlarmService | null = null

export const getAnalyzeAlarmService = (): AnalyzeAlarmService => {
  if (!analyzeAlarmServiceInstance) {
    analyzeAlarmServiceInstance = new AnalyzeAlarmService()
  }
  return analyzeAlarmServiceInstance
}
