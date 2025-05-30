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
    return {
      ...chart,
      createTime: dayjs(chart.createTime).format(
        'YYYY-MM-DD HH:mm:ss'
      ),
      updateTime: dayjs(chart.updateTime).format(
        'YYYY-MM-DD HH:mm:ss'
      ),
      chartConfig: {
        dataSource: chart.chartConfig?.dataSource || '',
        column:
          chart.chartConfig?.column?.map((col) => ({
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
          })) || [],
        dimension:
          chart.chartConfig?.dimension?.map((dim) => ({
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
          })) || [],
        filter:
          chart.chartConfig?.filter?.map((fil) => ({
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
          })) || [],
        group:
          chart.chartConfig?.group?.map((grp) => ({
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
          })) || [],
        order:
          chart.chartConfig?.order?.map((ord) => ({
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
          })) || []
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
    const charts = await this.chartsMapper.getCharts()
    return charts.map(this.formatChart)
  }

  /**
   * @desc 保存图表
   * @param chart {ChartsConfigDto.ChartsConfigDto} 图表
   * @returns {Promise<boolean>}
   */
  public async updateChart(
    chartsConfigDto: ChartsConfigDto.ChartsConfigDto
  ): Promise<boolean> {
    const { chartConfig, ...chartOption } = chartsConfigDto
    const chart = await this.chartsMapper.updateChart({
      id: chartOption.id,
      chartName: chartOption.chartName,
      chartType: chartOption.chartType,
      chartConfigId: chartOption.chartConfigId,
      viewCount: 0,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      createdBy: 'system',
      updatedBy: 'system'
    })

    const configResult =
      await this.chartConfigMapper.updateChartConfig({
        id: chartOption.chartConfigId,
        ...chartConfig
      })
    return chart && configResult
  }
}
