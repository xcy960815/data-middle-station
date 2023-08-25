import { DepartmentsDao } from '../../database/departments';
/**
 * @description 新增或者更新部门
 * @param {DepartmentsModule.DepartmentsOptions} event.body
 * @returns {void}
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<DepartmentsModule.DepartmentsOptions>(event);
    const departmentId = body.departmentId;
    const departmentsDao = new DepartmentsDao();
    if (departmentId) {
      const result = await departmentsDao.updateById(departmentId as number, body);
      return {
        code: 200,
        data: result[0],
        message: 'success',
      };
    } else {
      const result = await departmentsDao.insert(body);
      return {
        code: 200,
        data: result[0],
        message: 'success',
      };
    }
  } catch (error: any) {
    return {
      code: 500,
      data: null,
      message: error.message,
    };
  }
});
