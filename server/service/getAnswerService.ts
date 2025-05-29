import { GetAnswerMapper } from '../mapper/getAnswerMapper'

export class GetAnswerService {
  private getAnswerMapper: GetAnswerMapper

  constructor() {
    this.getAnswerMapper = new GetAnswerMapper()
  }

  public async getAnswer(
    chartOption: GetAnswerDto.GetAnswerParamsDto
  ): Promise<GetAnswerDao.ChartDataDao> {
    return this.getAnswerMapper.getAnswer(chartOption)
  }
}
