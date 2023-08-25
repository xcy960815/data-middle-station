import dayjs from 'dayjs';
import { DOBase, Mapping, BindDataSource, Column } from './dobase';
export class EmployeesOptions implements EmployeesModule.EmployeesOptions {
  @Column('employee_id')
  employeeId: number = 0;
  @Column('first_name')
  firstName: string = '';
  @Column('last_name')
  lastName: string = '';
  @Column('email')
  email: string = '';
  @Column('phone_number')
  phoneNumber: string = '';
  @Column('job_id')
  jobId: string = '';
  @Column('salary')
  salary: number = 0;
  @Column('commission_pct')
  commissionPct: number = 0;
  @Column('manager_id')
  managerId: number = 0;
  @Column('department_id')
  departmentId: number = 0;
  @Column('hiredate')
  hiredate(newDate: string): string {
    return dayjs(newDate).format('YYYY-MM-DD');
  }
  @Column('status')
  status: 0 | 1 = 1;
  @Column('total')
  total: number = 0;
}

@BindDataSource('blog')
export class EmployeesDao extends DOBase {
  @Mapping(EmployeesOptions)
  protected async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params);
  }
  /**
   * @datasource blog
   * @table employees
   * @desc 查询所有的数据
   * @returns {Promise<Array<EmployeesModule.EmployeesOptions>>}
   * @memberof EmployeesDao
   */
  public async queryAll(): Promise<Array<EmployeesModule.EmployeesOptions>> {
    const sql =
      'SELECT employee_id, first_name, last_name, email, phone_number, job_id, salary, commission_pct, manager_id, department_id, hiredate FROM blog.employees';
    return await this.exe<Array<EmployeesModule.EmployeesOptions>>(sql);
  }
  /**
   * @datasource blog
   * @table employees
   * @desc 根据id查询数据
   * @param {number} id
   * @returns {Promise<Array<EmployeesModule.EmployeesOptions>>}
   * @memberof EmployeesDao
   */
  public async queryById(id: number): Promise<Array<EmployeesModule.EmployeesOptions>> {
    const sql =
      'SELECT employee_id, first_name, last_name, email, phone_number, job_id, salary, commission_pct, manager_id, department_id, hiredate FROM blog.employees WHERE employee_id = ?';
    return await this.exe<Array<EmployeesModule.EmployeesOptions>>(sql, [id]);
  }
  /**
   * @datasource blog
   * @table employees
   * @desc 根据id删除数据
   * @param {number} id
   * @returns {Promise<Array<EmployeesModule.EmployeesOptions>>}
   * @memberof EmployeesDao
   */
  public async deleteById(id: number): Promise<Array<EmployeesModule.EmployeesOptions>> {
    // const sql = 'DELETE FROM blog.employees WHERE employee_id = ?';
    // return await this.exe<Array<EmployeesModule.EmployeesOptions>>(sql, [id]);
    // 软删除
    const sql = 'UPDATE blog.employees SET status = 1 WHERE employee_id = ?';
    return await this.exe<Array<EmployeesModule.EmployeesOptions>>(sql, [id]);
  }
  /**
   * @datasource blog
   * @table employees
   * @desc 根据id更新数据
   * @param {number} id
   * @param {EmployeesModule.EmployeesOptions} data
   * @returns {Promise<Array<EmployeesModule.EmployeesOptions>>}
   * @memberof EmployeesDao
   */
  public async updateById(
    id: number,
    data: EmployeesModule.EmployeesOptions,
  ): Promise<Array<EmployeesModule.EmployeesOptions>> {
    const sql =
      'UPDATE blog.employees SET first_name = ?, last_name = ?, email = ?, phone_number = ?, job_id = ?, salary = ?, commission_pct = ?, manager_id = ?, department_id = ?, hiredate = ? WHERE employee_id = ?';
    return await this.exe<Array<EmployeesModule.EmployeesOptions>>(sql, [
      data.firstName,
      data.lastName,
      data.email,
      data.phoneNumber,
      data.jobId,
      data.salary,
      data.commissionPct,
      data.managerId,
      data.departmentId,
      data.hiredate,
      id,
    ]);
  }
  /**
   * @datasource blog
   * @table employees
   * @desc 新增数据
   * @param {EmployeesModule.EmployeesOptions} data
   * @returns {Promise<Array<EmployeesModule.EmployeesOptions>>}
   * @memberof EmployeesDao
   */
  public async insert(
    data: EmployeesModule.EmployeesOptions,
  ): Promise<Array<EmployeesModule.EmployeesOptions>> {
    const sql =
      'INSERT INTO blog.employees (first_name, last_name, email, phone_number, job_id, salary, commission_pct, manager_id, department_id, hiredate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return await this.exe<Array<EmployeesModule.EmployeesOptions>>(sql, [
      data.firstName,
      data.lastName,
      data.email,
      data.phoneNumber,
      data.jobId,
      data.salary,
      data.commissionPct,
      data.managerId,
      data.departmentId,
      data.hiredate,
    ]);
  }
  /**
   * @datasource blog
   * @table employees
   * @desc 查询总数
   * @returns {Promise<number>}
   * @memberof EmployeesDao
   */
  public async queryTotal(): Promise<number> {
    const sql = `
    SELECT 
      COUNT(*) AS total 
    FROM blog.employees`;
    // return await this.exe<Array<EmployeesModule.EmployeesOptions>>(sql);
    const result = await this.exe<Array<{ total: number }>>(sql);
    return result[0].total;
  }
  /**
   * @datasource blog
   * @table employees
   * @description 分页查询
   * @param offset - 查询偏移量 0-based
   * @param limit - 每页显示数量
   * @returns {Promise<Array<EmployeesModule.EmployeesOptions>>}
   */
  public async queryByPage(
    offset: number,
    limit: number,
  ): Promise<Array<EmployeesModule.EmployeesOptions>> {
    limit = Number(limit);
    offset = Number(offset);
    const sql = `SELECT employee_id,
              first_name,
              last_name, email,
              phone_number,
              job_id, salary,
              commission_pct,
              manager_id,
              department_id,
              hiredate
        FROM blog.employees
        WHERE status = 0
        LIMIT ?,?`;

    // 计算偏移量并替换到 SQL 中的占位符中
    const params = [(offset - 1) * limit, limit];
    return await this.exe<Array<EmployeesModule.EmployeesOptions>>(sql, params);
  }
}
