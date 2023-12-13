// import { EmployeesDao } from '../../database/employees';



// /**
//  * @desc 新建或更新员工数据
//  * @returns {Promise<ResponseModule.Response<EmployeesModule.EmployeesOptions>>}
//  */
// export default defineEventHandler(async (event) => {
//   try {
//     const body = await readBody(event);
//     const employeeId = body.employeeId;
//     const employeesDao = new EmployeesDao();
//     if (employeeId) {
//       const result = await employeesDao.updateById(employeeId as number, body);
//       return {
//         code: 200,
//         data: result[0],
//         message: 'success',
//       };
//     } else {
//       const result = await employeesDao.insert(body);
//       return {
//         code: 200,
//         data: result[0],
//         message: 'success',
//       };
//     }
//   } catch (error: any) {
//     return {
//       code: 500,
//       data: null,
//       message: error.message,
//     };
//   }
// });
