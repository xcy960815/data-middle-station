import { ChartDataMapper } from '@/server/mapper/chartDataMapper'
import { AnalyzeQueryBuilder, type AnalyzeQueryContext } from '@/server/service/analyzeQueryBuilder'
import { DatabaseService } from '@/server/service/databaseService'

/**
 * @desc 图表数据服务
 */
export class ChartDataService {
  /**
   * @desc 图表数据mapper
   */
  private chartDataMapper: ChartDataMapper

  /**
   * @desc 数据库服务
   */
  private databaseService: DatabaseService

  /**
   * @desc SQL 构建器
   */
  private analyzeQueryBuilder: AnalyzeQueryBuilder

  /**
   * @desc 构造函数
   */
  constructor() {
    this.chartDataMapper = new ChartDataMapper()
    this.databaseService = new DatabaseService()
    this.analyzeQueryBuilder = new AnalyzeQueryBuilder()
  }

  /**
   * @desc 将DAO对象转换为VO对象
   * @param analyzeDataRecords {AnalyzeDataDao.AnalyzeData[]} 图表数据DAO列表
   * @returns {AnalyzeDataVo.AnalyzeData[]} 图表数据VO列表
   */
  private convertDaoToVo(analyzeDataRecords: Array<AnalyzeDataDao.AnalyzeData>): Array<AnalyzeDataVo.AnalyzeData> {
    return analyzeDataRecords.map((analyzeDataRecord) => ({
      ...analyzeDataRecord,
      [String(analyzeDataRecord.columnName)]: analyzeDataRecord.columnValue
    }))
  }

  /**
   * @desc 创建查询上下文
   * @param dataSource 数据源表名
   * @returns 查询上下文
   */
  private async createQueryContext(dataSource: string): Promise<AnalyzeQueryContext> {
    const normalizedTableName = this.analyzeQueryBuilder.normalizeIdentifier(dataSource, '数据源')
    const columns = await this.databaseService.getTableColumns({
      tableName: normalizedTableName
    })

    if (columns.length === 0) {
      throw new Error(`数据源不存在或无可用字段: ${normalizedTableName}`)
    }

    return {
      tableName: normalizedTableName,
      quotedTableName: this.analyzeQueryBuilder.quoteIdentifier(normalizedTableName),
      allowedColumns: new Set(
        columns.map((column) => this.analyzeQueryBuilder.normalizeIdentifier(column.columnName, '字段'))
      )
    }
  }

  /**
   * @desc 获取图表数据
   * @param analyzeDataQuery {AnalyzeDataDto.AnalyzeDataQuery} 请求参数
   * @returns {Promise<AnalyzeDataVo.AnalyzeData[]>}
   */
  public async getAnalyzeData(
    analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery
  ): Promise<Array<AnalyzeDataVo.AnalyzeData>> {
    const queryContext = await this.createQueryContext(analyzeDataQuery.dataSource)
    const { sql, params } = this.analyzeQueryBuilder.buildAnalyzeDataQuery(analyzeDataQuery, queryContext)

    try {
      const analyzeDataRecords = await this.chartDataMapper.getAnalyzeData(sql, params)
      return this.convertDaoToVo(analyzeDataRecords)
    } catch (error: any) {
      error.sql = sql
      throw error
    }
  }
}
