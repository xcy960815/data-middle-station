import { EmployeesDao } from '../../database/employees';


/**
 * @description 删除员工
 * @param {number} id 员工id
 * @return {Promise<ResponseModule.Response<EmployeesModule.EmployeesOptions | null>>}
 */
export default defineEventHandler<Promise<ResponseModule.Response<EmployeesModule.EmployeesOptions>>>(
  async (event) => {
    try {
      const { id } = getQuery(event);
      const employeesDao = new EmployeesDao();
      await employeesDao.deleteById(id as number);
      return {
        code: 200,
        data: null,
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
