import { DepartmentsDao } from '../../database/departments';

interface ResponseData {
  data: Array<DepartmentsModule.DepartmentsOptions>;
  total: number;
}
/**
 * @desc 获取部门列表接口
 * @returns {Promise<ResponseModule.Response<ResponseData>>}
 */
export default defineEventHandler<Promise<ResponseModule.Response<ResponseData>>>(async (event) => {
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
