import { BaseMapper } from '@/server/mapper/baseMapper'
import type { ResultSetHeader } from 'mysql2'

const DATA_SOURCE_NAME = 'data_middle_station'

const ROLE_TABLE_NAME = '`role`'
const ANALYZE_ROLE_PERMISSION_TABLE_NAME = '`analyze_role_permission`'

export class PermissionMapper extends BaseMapper {
  public dataSourceName = DATA_SOURCE_NAME

  public async getRoles(): Promise<PermissionVo.RoleItem[]> {
    const sql = `
      select
        id,
        role_code as roleCode,
        role_name as roleName
      from ${ROLE_TABLE_NAME}
      where is_deleted = 0 and status = 1
      order by id asc`
    return await this.exe<PermissionVo.RoleItem[]>(sql)
  }

  public async getAnalyzeRolePermissions(
    analyzeId: number
  ): Promise<Array<{ roleId: number; permissionType: string }>> {
    const sql = `
      select
        role_id as roleId,
        permission_type as permissionType
      from ${ANALYZE_ROLE_PERMISSION_TABLE_NAME}
      where analyze_id = ?`
    return await this.exe<Array<{ roleId: number; permissionType: string }>>(sql, [analyzeId])
  }

  public async replaceAnalyzeRolePermissions(
    analyzeId: number,
    permissions: Array<{ roleId: number; permissionType: Exclude<PermissionVo.AnalyzePermissionType, 'none'> }>,
    operator: string
  ) {
    await this.exe<ResultSetHeader>(`delete from ${ANALYZE_ROLE_PERMISSION_TABLE_NAME} where analyze_id = ?`, [
      analyzeId
    ])

    if (permissions.length === 0) {
      return true
    }

    const values = permissions.flatMap((item) => [analyzeId, item.roleId, item.permissionType, operator, operator])
    const placeholders = permissions.map(() => '(?, ?, ?, ?, ?)').join(',')
    const sql = `
      insert into ${ANALYZE_ROLE_PERMISSION_TABLE_NAME}
        (analyze_id, role_id, permission_type, created_by, updated_by)
      values ${placeholders}`
    await this.exe<ResultSetHeader>(sql, values)
    return true
  }
}
