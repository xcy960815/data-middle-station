import { ChartsMapper } from '../mapper/chartsMapper'
/**
 * @desc 分析服务
 */
export class ChartsService {
  private chartsMapper: ChartsMapper

  constructor() {
    this.chartsMapper = new ChartsMapper()
  }

  public async getChartById(
    id: number
  ): Promise<ChartsDao.ChartsOption> {
    return this.chartsMapper.getChartById(id)
  }
}
