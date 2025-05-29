import { TableMapper } from '../mapper/tableMapper'
import { ChartsMapper } from '../mapper/chartsMapper'
/**
 * @desc 分析服务
 */
export class AnalyseService {
  private tableMapper: TableMapper
  private chartsMapper: ChartsMapper

  constructor() {
    this.tableMapper = new TableMapper()
    this.chartsMapper = new ChartsMapper()
  }

  public async queryTable(
    tableName: string
  ): Promise<Array<TableInfoVo.TableOptionVo>> {
    return this.tableMapper.queryTable(tableName)
  }

  public async queryTableColumns(
    tableName: string
  ): Promise<Array<TableInfoVo.TableColumnOptionVo>> {
    return this.tableMapper.queryTableColumns(tableName)
  }

  public async getAnswer(
    chartOption: any
  ): Promise<boolean> {
    return this.chartsMapper.getAnswer(chartOption)
  }
}
