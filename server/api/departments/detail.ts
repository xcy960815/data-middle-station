import { DepartmentsDao } from '../../database/departments';

/**
 * @desc 部门根据id查询数据
 * @param {RequestModule.Request} event
 * @returns {Promise<ResponseModule.Response<DepartmentsModule.DepartmentsOptions>>}
 */

export default defineEventHandler<
  Promise<ResponseModule.Response<DepartmentsModule.DepartmentsOptions> | null>
>(async (event) => {
  try {
    const { id } = getQuery(event);
    const departmentsDao = new DepartmentsDao();
    const data = await departmentsDao.queryById(id as number);
    return {
      code: data ? 200 : 404,
      data,
      message: 'success',
    };
  } catch (error: any) {
    throw await createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
