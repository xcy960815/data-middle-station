import { DepartmentsDao } from '../../database/departments';

/**
 * @desc 
 * @returns {Promise<ResponseModule.Response<DepartmentsModule.DepartmentsOptions>>}
 */
export default defineEventHandler(
  async (event) => {
    return {
        name:"xcy"
    }
  },
);