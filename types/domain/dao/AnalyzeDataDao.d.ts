/**
 * @desc 分析数据
 */
declare namespace AnalyzeDataDao {
  /**
   * @desc 分析数据
   */
  type AnalyzeData = {
    [key: string]: string | number | AnalyzeData | undefined | null | boolean
  }
}
