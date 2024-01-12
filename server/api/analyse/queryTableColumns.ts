

import { AnalyseDao } from '../../database/analyse';
import { Response } from "../../database/response"
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
      return Response.success(data);
    } catch (error: any) {
      return Response.error(error.message);
    }
  },
);
