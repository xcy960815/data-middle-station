import { DOBase, Mapping, BindDataSource, Column } from './dobase';
export class DepartmentsOptions implements DepartmentsModule.DepartmentsOptions {
  @Column('department_id')
  departmentId: number = 0;
  @Column('department_name')
  departmentName: string = '';
  @Column('manager_id')
  managerId: number = 0;
  @Column('location_id')
  locationId: number = 0;
  @Column('total')
  total: number = 0;
  @Column('status')
  status: 0 | 1 = 0;
}

@BindDataSource('blog')
export class DepartmentsDao extends DOBase {
  @Mapping(DepartmentsOptions)
  protected exe<T>(sql: string, params?: any[] | undefined): Promise<T> {
    return super.exe<T>(sql, params);
  }
  /**
   * @desc 查询所有的数据
   * @returns {Promise<Array<DepartmentsModule.DepartmentsOptions>>}
   * @memberof DepartmentsDao
   */
  public async queryAll(): Promise<Array<DepartmentsModule.DepartmentsOptions>> {
    const sql =
      'SELECT department_id, department_name, manager_id, location_id FROM blog.departments';
    return await this.exe<Array<DepartmentsModule.DepartmentsOptions>>(sql);
  }
  /**
   * @table departments
   * @desc 根据id查询数据
   * @param {number} id
   * @returns {Promise<Array<DepartmentsModule.DepartmentsOptions>>}
   * @memberof DepartmentsDao
   */
  public async queryById(id: number): Promise<DepartmentsModule.DepartmentsOptions> {
    id = Number(id);
    const sql = `SELECT 
        department_id, 
        department_name, 
        manager_id, 
        location_id 
       FROM blog.departments 
       WHERE department_id = ?`;
    const departmentsOptions = await this.exe<Array<DepartmentsModule.DepartmentsOptions>>(sql, [
      id,
    ]);

    return departmentsOptions[0];
  }
  /**
   * @table departments
   * @desc 根据id删除数据
   * @param {number} id
   * @returns {Promise<Array<DepartmentsModule.DepartmentsOptions>>}
   * @memberof DepartmentsDao
   */
  public async deleteById(id: number): Promise<Array<DepartmentsModule.DepartmentsOptions>> {
    // const sql = 'DELETE FROM blog.departments WHERE department_id = ?';
    // return await this.exe<Array<DepartmentsModule.DepartmentsOptions>>(sql, [id]);
    // 软删除
    const sql = 'UPDATE blog.departments SET status = 1 WHERE department_id = ?';
    return await this.exe<Array<DepartmentsModule.DepartmentsOptions>>(sql, [id]);
  }
  /**
   * @table departments
   * @desc 新增数据
   * @param {DepartmentsModule.DepartmentsOptions} departmentsOptions
   * @returns {Promise<Array<DepartmentsModule.DepartmentsOptions>>}
   * @memberof DepartmentsDao
   */
  public async insert(
    departmentsOptions: DepartmentsModule.DepartmentsOptions,
  ): Promise<Array<DepartmentsModule.DepartmentsOptions>> {
    const sql = 'INSERT INTO blog.departments SET ?';
    return await this.exe<Array<DepartmentsModule.DepartmentsOptions>>(sql, [departmentsOptions]);
  }
  /**
   * @table departments
   * @desc 根据id更新数据
   * @param {DepartmentsModule.DepartmentsOptions} departmentsOptions
   * @returns {Promise<Array<DepartmentsModule.DepartmentsOptions>>}
   * @memberof DepartmentsDao
   */
  public async updateById(
    departmentId: number,
    departmentsOptions: DepartmentsModule.DepartmentsOptions,
  ): Promise<Array<DepartmentsModule.DepartmentsOptions>> {
    const sql =
      'UPDATE blog.departments SET department_name = ?,manager_id = ?,location_id = ?  WHERE department_id = ?';
    return await this.exe<Array<DepartmentsModule.DepartmentsOptions>>(sql, [
      departmentsOptions.departmentName,
      departmentsOptions.managerId,
      departmentsOptions.locationId,
      departmentId,
    ]);
  }

  /**
   * @table departments
   * @desc 分页查询
   * @param {number} page
   * @param {number} size
   * @returns {Promise<Array<DepartmentsModule.DepartmentsOptions>>}
   * @memberof DepartmentsDao
   */
  public async queryByPage(
    page: number,
    size: number,
  ): Promise<Array<DepartmentsModule.DepartmentsOptions>> {
    page = Number(page);
    size = Number(size);
    const sql = `SELECT 
        department_id, 
        department_name, 
        manager_id, 
        location_id 
      FROM blog.departments 
      LIMIT ?, ?`;
    return await this.exe<Array<DepartmentsModule.DepartmentsOptions>>(sql, [
      (page - 1) * size,
      size,
    ]);
  }
  /**
   * @table departments
   * @desc 查询总数
   * @returns {Promise<number>}
   * @memberof DepartmentsDao
   */
  public async queryTotal(): Promise<number> {
    const sql = `SELECT 
      COUNT(*) AS total 
      FROM blog.departments`;
    const result = await this.exe<Array<{ total: number }>>(sql);
    return result[0].total;
  }
}
