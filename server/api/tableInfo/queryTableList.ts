import { TableInfoDao } from '../../database/tableInfo';

/**
 * @desc 获取所有的表名
 * @returns {Promise<ResponseModule.Response<Array<{label:string,value:string}>>>}
 */
export default defineEventHandler(
  async (_event) => {
    try {
        const tableInfo = new TableInfoDao();
        const tableList = (await tableInfo.queryTableList()).map(item=>{
          return {
            label:item.tableName,
            value:item.tableName
          }
        })
        return {
            code: 200,
            data: tableList,
            message: 'success',
        }
    }catch (e) {
       return {
            code: 500,
            data:null,
            message: e,
          };
    }
   
  },
);