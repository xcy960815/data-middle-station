import { EmployeesDao } from '../../database/employees';

/**
 * @description 查询员工详情
 * @param {number} id 员工id
 * @return {ResponseModule.Response<EmployeesModule.EmployeesOptions | null>}
 */
export default defineEventHandler<ResponseModule.Response<EmployeesModule.EmployeesOptions>>(
  async (event) => {
    try {
      const { id } = getQuery(event);
      const employeesDao = new EmployeesDao();
      const result = await employeesDao.queryById(id as number);
      return {
        code: 200,
        data: result[0],
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
