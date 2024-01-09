import { AnalyseDao } from '../../database/analyse';

type TableOption = {
  label: string
  value: string
}
/**
 * @desc 获取所有的表名
 * @returns {Promise<ResponseModule.Response<Array<TableOption>>>}
 */
export default defineEventHandler<Promise<ResponseModule.Response<Array<TableOption>>>>(
  async (_event) => {
    try {
      const analyseInstence = new AnalyseDao();
      const tableList = (await analyseInstence.queryTableList()).map(item => {
        return {
          label: item.tableName || '',
          value: item.tableName || '',
        }
      })
      return {
        code: 200,
        data: tableList,
        message: 'success',
      }
    } catch (error:any) {
      return {
        code: 500,
        data: null,
        message: error.message,
      };
    }

  },
);