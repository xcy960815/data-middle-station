import { AnalyzeAlarmMapper } from '@/server/mapper/analyzeAlarmMapper'
import { AnalyzeService } from '@/server/service/analyzeService'
import { ChartDataService } from '@/server/service/chartDataService'
import { BaseService } from '@/server/service/baseService'
import { resolveAnalyzeDrillQueryFields } from '@/shared/analyzeDrillState'
import { validateAnalyzeChartConfig } from '@/utils/validateAnalyzeChartConfig'
import { Logger } from '@/server/utils/logger'

const logger = new Logger({ fileName: 'analyze-alarm-service', folderName: 'server' })

/**
 * @class AnalyzeAlarmService
 * @extends BaseService
 * @description 分析图表报警服务类，负责报警规则的 CRUD、报警规则调度与触发评估、发送通知以及报警日志记录。
 */
export class AnalyzeAlarmService extends BaseService {
  /**
   * 报警规则数据访问映射器
   * @private
   * @type {AnalyzeAlarmMapper}
   */
  private analyzeAlarmMapper: AnalyzeAlarmMapper

  /**
   * 分析图表服务类，用于获取图表配置
   * @private
   * @type {AnalyzeService}
   */
  private analyzeService: AnalyzeService

  /**
   * 图表数据服务类，用于获取图表当前的实时数据
   * @private
   * @type {ChartDataService}
   */
  private chartDataService: ChartDataService

  /**
   * 构造函数，初始化映射器和服务实例
   */
  constructor() {
    super()
    this.analyzeAlarmMapper = new AnalyzeAlarmMapper()
    this.analyzeService = new AnalyzeService()
    this.chartDataService = new ChartDataService()
  }

  /**
   * 获取报警规则列表
   * @public
   * @param {AnalyzeAlarmDao.GetAnalyzeAlarmParams} params 查询过滤参数
   * @returns {Promise<AnalyzeAlarmDao.AnalyzeAlarmRecord[]>} 报警规则数组
   */
  public async getAlarms(params: AnalyzeAlarmDao.GetAnalyzeAlarmParams) {
    return await this.analyzeAlarmMapper.getAnalyzeAlarms(params)
  }

  /**
   * 根据 ID 获取单个报警规则详情
   * @public
   * @param {number} id 报警规则 ID
   * @returns {Promise<AnalyzeAlarmDao.AnalyzeAlarmRecord | null>} 报警规则记录，若不存在则返回 null
   */
  public async getAlarmById(id: number) {
    return await this.analyzeAlarmMapper.getAnalyzeAlarmById(id)
  }

  /**
   * 创建新的报警规则，并尝试注册定时调度任务
   * @public
   * @param {Omit<AnalyzeAlarmDao.CreateAnalyzeAlarmParams, 'createdBy' | 'updatedBy'>} params 报警规则创建参数
   * @returns {Promise<number>} 新创建的报警规则 ID
   */
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

  /**
   * 更新报警规则，并同步更新定时调度任务
   * @public
   * @param {Omit<AnalyzeAlarmDao.UpdateAnalyzeAlarmParams, 'updatedBy'>} params 报警规则更新参数
   * @returns {Promise<boolean>} 是否更新成功
   */
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

  /**
   * 删除指定的报警规则
   * @public
   * @param {number} id 报警规则 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  public async deleteAlarm(id: number) {
    return await this.analyzeAlarmMapper.deleteAnalyzeAlarm(id)
  }

  /**
   * 获取指定报警规则的历史评估执行日志列表
   * @public
   * @param {number} alarmId 报警规则 ID
   * @returns {Promise<AnalyzeAlarmDao.AnalyzeAlarmLogRecord[]>} 报警日志记录数组
   */
  public async getAlarmLogs(alarmId: number) {
    return await this.analyzeAlarmMapper.getAnalyzeAlarmLogs(alarmId)
  }

  /**
   * 切换报警规则的激活/启用状态
   * @public
   * @param {number} id 报警规则 ID
   * @throws {Error} 报警规则不存在时抛出异常
   * @returns {Promise<boolean>} 更新后的状态是否保存成功
   */
  public async toggleAlarmStatus(id: number) {
    const alarm = await this.getAlarmById(id)
    if (!alarm) throw new Error('报警规则不存在')
    return await this.updateAlarm({ id, isActive: alarm.isActive ? 0 : 1 })
  }

  /**
   * 评估单个报警规则。加载图表数据并校验条件，若触发则根据策略发送通知并记录日志。
   * @public
   * @param {AnalyzeAlarmDao.AnalyzeAlarmRecord} alarm 待评估的报警规则记录
   * @returns {Promise<void>}
   */
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

  /**
   * 检查实时数据行是否满足报警条件。只要有一行数据满足全部条件即可触发。
   * @private
   * @param {Array<AnalyzeDataVo.AnalyzeData>} data 图表实时查询数据数组
   * @param {AnalyzeAlarmDao.AlarmCondition[]} conditions 报警条件配置列表
   * @returns {{ met: boolean, detail: any }} 包含是否触发(met)及触发行明细数据(detail)的对象
   */
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

  /**
   * 根据报警策略（如每次、每天一次、状态改变时）检查本次触发是否应该发送通知
   * @private
   * @param {AnalyzeAlarmDao.AnalyzeAlarmRecord} alarm 报警规则记录
   * @returns {Promise<boolean>} 是否应发送通知
   */
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

  /**
   * 发送报警通知（支持邮件通知和 Webhook）
   * @private
   * @param {AnalyzeAlarmDao.AnalyzeAlarmRecord} alarm 报警规则记录
   * @param {string} analyzeName 分析看板名称
   * @param {*} detail 触发报警的行明细数据
   * @returns {Promise<void>}
   */
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

/**
 * 单例报警服务实例
 * @type {AnalyzeAlarmService | null}
 */
let analyzeAlarmServiceInstance: AnalyzeAlarmService | null = null

/**
 * 获取 AnalyzeAlarmService 的单例实例
 * @returns {AnalyzeAlarmService} 报警服务实例
 */
export const getAnalyzeAlarmService = (): AnalyzeAlarmService => {
  if (!analyzeAlarmServiceInstance) {
    analyzeAlarmServiceInstance = new AnalyzeAlarmService()
  }
  return analyzeAlarmServiceInstance
}
