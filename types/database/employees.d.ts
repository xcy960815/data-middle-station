/**
 * @desc employees 表结构
 */
declare namespace EmployeesModule {
  // type HiredateRetrunType<T> = T extends string ? string : ReturnType<typeof T>;
  interface EmployeesOptions {
    status?: 0 | 1
    employeeId: number
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    jobId: string
    salary: number
    commissionPct: number
    managerId: number
    departmentId: number
    hiredate: string | ((...args: any[]) => string)
    total?: number
  }
}
