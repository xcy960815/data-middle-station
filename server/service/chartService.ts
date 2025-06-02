import { ChartsMapper } from '../mapper/chartMapper'
import dayjs from 'dayjs'
import { ChartConfigMapper } from '../mapper/chartConfigMapper'

/**
 * @desc 分析服务
 */
export class ChartsService {
  private chartsMapper: ChartsMapper

  private chartConfigMapper: ChartConfigMapper

  constructor() {
    this.chartsMapper = new ChartsMapper()
    this.chartConfigMapper = new ChartConfigMapper()
  }

  /**
   * @desc 格式化图表
   * @param chart {ChartDao.ChartOptionDao} 图表
   * @returns {ChartsVo.ChartsOptionVo}
   */
  private formatChart(
    chart: ChartDao.ChartOptionDao
  ): ChartsVo.ChartsOptionVo {
    const chartConfig = chart.chartConfig || {
      dataSource: '',
      column: [],
      dimension: [],
      filter: [],
      group: [],
      order: []
    }

    return {
      ...chart,
      createTime: dayjs(chart.createTime).format(
        'YYYY-MM-DD HH:mm:ss'
      ),
      updateTime: dayjs(chart.updateTime).format(
        'YYYY-MM-DD HH:mm:ss'
      ),
      chartConfig: {
        dataSource: chartConfig.dataSource || '',
        column: Array.isArray(chartConfig.column)
          ? chartConfig.column.map((col) => ({
              columnName:
                typeof col.columnName === 'function'
                  ? col.columnName('')
                  : col.columnName,
              columnType:
                typeof col.columnType === 'function'
                  ? col.columnType('')
                  : col.columnType,
              columnComment: col.columnComment,
              alias:
                typeof col.columnName === 'function'
                  ? col.columnName('')
                  : col.columnName,
              displayName:
                typeof col.columnName === 'function'
                  ? col.columnName('')
                  : col.columnName
            }))
          : [],
        dimension: Array.isArray(chartConfig.dimension)
          ? chartConfig.dimension.map((dim) => ({
              columnName:
                typeof dim.columnName === 'function'
                  ? dim.columnName('')
                  : dim.columnName,
              columnType:
                typeof dim.columnType === 'function'
                  ? dim.columnType('')
                  : dim.columnType,
              columnComment: dim.columnComment,
              alias:
                typeof dim.columnName === 'function'
                  ? dim.columnName('')
                  : dim.columnName,
              displayName:
                typeof dim.columnName === 'function'
                  ? dim.columnName('')
                  : dim.columnName,
              __invalid: dim.__invalid
            }))
          : [],
        filter: Array.isArray(chartConfig.filter)
          ? chartConfig.filter.map((fil) => ({
              columnName:
                typeof fil.columnName === 'function'
                  ? fil.columnName('')
                  : fil.columnName,
              columnType:
                typeof fil.columnType === 'function'
                  ? fil.columnType('')
                  : fil.columnType,
              columnComment: fil.columnComment,
              alias:
                typeof fil.columnName === 'function'
                  ? fil.columnName('')
                  : fil.columnName,
              displayName:
                typeof fil.columnName === 'function'
                  ? fil.columnName('')
                  : fil.columnName,
              filterType: fil.filterType,
              filterValue: fil.filterValue,
              aggregationType: fil.aggregationType
            }))
          : [],
        group: Array.isArray(chartConfig.group)
          ? chartConfig.group.map((grp) => ({
              columnName:
                typeof grp.columnName === 'function'
                  ? grp.columnName('')
                  : grp.columnName,
              columnType:
                typeof grp.columnType === 'function'
                  ? grp.columnType('')
                  : grp.columnType,
              columnComment: grp.columnComment,
              alias:
                typeof grp.columnName === 'function'
                  ? grp.columnName('')
                  : grp.columnName,
              displayName:
                typeof grp.columnName === 'function'
                  ? grp.columnName('')
                  : grp.columnName,
              __invalid: grp.__invalid
            }))
          : [],
        order: Array.isArray(chartConfig.order)
          ? chartConfig.order.map((ord) => ({
              columnName:
                typeof ord.columnName === 'function'
                  ? ord.columnName('')
                  : ord.columnName,
              columnType:
                typeof ord.columnType === 'function'
                  ? ord.columnType('')
                  : ord.columnType,
              columnComment: ord.columnComment,
              alias:
                typeof ord.columnName === 'function'
                  ? ord.columnName('')
                  : ord.columnName,
              displayName:
                typeof ord.columnName === 'function'
                  ? ord.columnName('')
                  : ord.columnName,
              orderType: ord.orderType,
              aggregationType: ord.aggregationType
            }))
          : []
      }
    }
  }

  /**
   * @desc 获取图表
   * @param id {number} 图表id
   * @returns {Promise<ChartsVo.ChartsOption>}
   */
  public async getChartById(
    id: number
  ): Promise<ChartsVo.ChartsOptionVo> {
    const chartOption =
      await this.chartsMapper.getChartById(id)
    const chartConfig =
      await this.chartConfigMapper.getChartConfigById(
        chartOption.chartConfigId
      )
    return this.formatChart({
      ...chartOption,
      chartConfig
    })
  }

  /**
   * @desc 获取所有图表
   * @returns {Promise<ChartsVo.ChartsOption[]>}
   */
  public async getCharts(): Promise<
    ChartsVo.ChartsOptionVo[]
  > {
    const chart = await this.chartsMapper.getCharts()
    return chart.map(this.formatChart)
  }

  /**
   * @desc 保存图表
   * @param chart {ChartsConfigDto.ChartsConfig} 图表
   * @returns {Promise<boolean>}
   */
  public async updateChart(
    chartsConfigDto: ChartsConfigDto.ChartsConfig
  ): Promise<boolean> {
    const { chartConfig, ...chartOption } = chartsConfigDto
    let chartConfigId = chartOption.chartConfigId
    if (!chartConfigId) {
      chartConfigId =
        await this.chartConfigMapper.createChartConfig({
          id: 0,
          ...chartConfig
        })
    } else {
      await this.chartConfigMapper.updateChartConfig({
        id: chartConfigId,
        ...chartConfig
      })
    }
    const chart = await this.chartsMapper.updateChart({
      id: chartOption.id,
      chartName: chartOption.chartName,
      chartType: chartOption.chartType,
      chartConfigId,
      viewCount: 0,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      createdBy: 'system',
      updatedBy: 'system'
    })
    return chart
  }

  /**
   * @desc 创建图表
   * @param chart {ChartsConfigDto.ChartsConfig} 图表
   * @returns {Promise<boolean>}
   */
  public async createChart(
    chartsConfigDto: ChartsConfigDto.ChartsConfig
  ): Promise<boolean> {
    const currentTime = dayjs().format(
      'YYYY-MM-DD HH:mm:ss'
    )
    const chartOptionDao: ChartDao.ChartOptionDao = {
      chartName: chartsConfigDto.chartName,
      chartType: chartsConfigDto.chartType,
      chartConfigId: chartsConfigDto.chartConfigId,
      chartConfig: chartsConfigDto.chartConfig || null,
      viewCount: 0,
      createTime: currentTime,
      updateTime: currentTime,
      createdBy: 'system',
      updatedBy: 'system'
    }

    return this.chartsMapper.createChart(chartOptionDao)
  }
}
