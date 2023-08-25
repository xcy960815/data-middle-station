/**
 * @desc departments 表结构
 */
declare namespace DepartmentsModule {
  interface DepartmentsOptions {
    departmentId: number | null
    departmentName: string
    managerId: number | null
    locationId: number | null
    status?: 0 | 1
    total?: number
  }
}
