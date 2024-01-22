

import { TableDao } from '../../database/table';
import { Response } from "../../database/response"
/**
 * @desc 根据表名查询数据
 * @returns {ResponseModule.Response<Array<TableInfoModule.TableColumnOption>>}
 */
export default defineEventHandler<Promise<ResponseModule.Response<Array<TableInfoModule.TableColumnOption>>>>(
  async (event) => {
    try {
      const { tableName } = getQuery<{
        tableName: string
      }>(event);
      const tableInstence = new TableDao();
      const data = await tableInstence.queryTableColumns(tableName);
      return Response.success(data);
    } catch (error: any) {
      return Response.error(error.message);
    }
  },
);
