import { DepartmentsDao } from '../../database/departments';

export default defineEventHandler<ResponseModule.Response<DepartmentsModule.DepartmentsOptions>>(
  async (event) => {
    try {
      const { id } = getQuery(event);
      const departmentsDao = new DepartmentsDao();
      await departmentsDao.deleteById(id as number);
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
