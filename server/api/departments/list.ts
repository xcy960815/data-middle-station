import { DepartmentsDao } from '../../database/departments';
interface ResponseData {
  data: Array<DepartmentsModule.DepartmentsOptions>;
  total: number;
}

export default defineEventHandler<ResponseModule.Response<ResponseData>>(async (event) => {
  try {
    const { pageNum, pageSize } = getQuery(event);
    const departmentsDao = new DepartmentsDao();
    const data = await departmentsDao.queryByPage(pageNum as number, pageSize as number);
    const total = await departmentsDao.queryTotal();
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
