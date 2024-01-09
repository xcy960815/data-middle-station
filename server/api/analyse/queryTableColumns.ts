

import { AnalyseDao } from '../../database/analyse';
/**
 * @desc 根据表名查询数据
 * @returns {ResponseModule.Response<Array<TableInfoModule.TableColumnOption>>}
 */
export default defineEventHandler<Promise<ResponseModule.Response<Array<TableInfoModule.TableColumnOption>>>>(
  async (event) => {
    try {
      const { tableName } = getQuery(event);
      const analyseInstence = new AnalyseDao();
      const data = await analyseInstence.queryTableColumns(tableName as string);
      return {
        code: 200,
        data,
        message: 'success',
      };
    } catch (error: any) {
      return {
        code: 500,
        data: null,
        message: error.message,
      };
    }
  },
);
