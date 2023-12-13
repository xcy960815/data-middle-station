import { AnalyseDao } from '../../database/analyse';

type tableOption = {
  label: string
  value: string
}
/**
 * @desc 获取所有的表名
 * @returns {Promise<ResponseModule.Response<Array<tableOption>>>}
 */
export default defineEventHandler(
  async (_event) => {
    try {
        const analyseInstence = new AnalyseDao();
        const tableList = (await analyseInstence.queryTableList()).map(item=>{
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
    }catch (error) {
       return {
            code: 500,
            data:null,
            message: error,
          };
    }
   
  },
);