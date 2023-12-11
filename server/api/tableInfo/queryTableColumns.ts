

import { TableInfoDao } from '../../database/tableInfo';
/**
 * @desc 根据表名查询数据
 * @returns {ResponseModule.Response<Array<TableInfoModule.TableInfoOptions>>}
 */
export default defineEventHandler(
  async (event) => {
    try {
      const { tableName } = getQuery(event);
      const tableInfoDao = new TableInfoDao();
      const data = await tableInfoDao.queryTableColumns(tableName as string);
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
