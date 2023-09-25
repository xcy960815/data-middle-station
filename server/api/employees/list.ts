import { EmployeesDao } from '../../database/employees';

interface Data {
  data: Array<EmployeesModule.EmployeesOptions>;
  total: number;
}
/**
 * @desc 查询员工列表
 * @param {import('h3').Event} event
 * @returns {Promise<ResponseModule.Response<ResponseData>>}
 */
export default defineEventHandler<Promise<ResponseModule.Response<Data>>>(async (event) => {
  try {
    const { pageNum, pageSize } = getQuery(event);
    const employeesDao = new EmployeesDao();
    const data = await employeesDao.queryByPage(pageNum as number, pageSize as number);
    const total = await employeesDao.queryTotal();
    return {
      code: 200,
      data: {
        data,
        total,
      },
      message: 'success',
    };
  } catch (error: any) {
    return {
      code: 500,
      data: null,
      message: error.message,
    };
  }
});
