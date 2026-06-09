import { BaseMapper } from '@/server/mapper/baseMapper'
import type { ResultSetHeader } from 'mysql2'

const DATA_SOURCE_NAME = 'data_middle_station'

const ROLE_TABLE_NAME = '`role`'
const RESOURCE_ROLE_PERMISSION_TABLE_NAME = '`resource_role_permission`'

/**
 * @desc 权限 mapper，负责角色与资源权限的查询和管理
 */
export class PermissionMapper extends BaseMapper {
  /**
   * @desc 当前 mapper 使用的数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 获取所有有效角色列表
   * @returns 角色列表
   */
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

  /**
   * @desc 获取指定资源的角色权限配置
   * @param resourceType 资源类型
   * @param resourceId 资源 ID
   * @returns 角色权限列表
   */
  public async getResourceRolePermissions(
    resourceType: PermissionVo.ResourceType,
    resourceId: number
  ): Promise<Array<{ roleId: number; permissionType: string }>> {
    const sql = `
      select
        role_id as roleId,
        permission_type as permissionType
      from ${RESOURCE_ROLE_PERMISSION_TABLE_NAME}
      where resource_type = ? and resource_id = ?`
    return await this.exe<Array<{ roleId: number; permissionType: string }>>(sql, [resourceType, resourceId])
  }

  /**
   * @desc 替换指定资源的角色权限配置（先删后插）
   * @param resourceType 资源类型
   * @param resourceId 资源 ID
   * @param permissions 权限列表
   * @param operator 操作人
   * @returns 是否操作成功
   */
  public async replaceResourceRolePermissions(
    resourceType: PermissionVo.ResourceType,
    resourceId: number,
    permissions: Array<{ roleId: number; permissionType: Exclude<PermissionVo.ResourcePermissionType, 'none'> }>,
    operator: string
  ) {
    await this.exe<ResultSetHeader>(
      `delete from ${RESOURCE_ROLE_PERMISSION_TABLE_NAME} where resource_type = ? and resource_id = ?`,
      [resourceType, resourceId]
    )

    if (permissions.length === 0) {
      return true
    }

    const values = permissions.flatMap((item) => [
      resourceType,
      resourceId,
      item.roleId,
      item.permissionType,
      operator,
      operator
    ])
    const placeholders = permissions.map(() => '(?, ?, ?, ?, ?, ?)').join(',')
    const sql = `
      insert into ${RESOURCE_ROLE_PERMISSION_TABLE_NAME}
        (resource_type, resource_id, role_id, permission_type, created_by, updated_by)
      values ${placeholders}`
    await this.exe<ResultSetHeader>(sql, values)
    return true
  }

  /**
   * @desc 根据角色列表查询用户在指定资源上的最高权限
   * @param resourceType 资源类型
   * @param resourceId 资源 ID
   * @param roleCodes 角色编码列表
   * @returns 最高权限类型
   */
  public async getMaxPermissionByRoles(
    resourceType: PermissionVo.ResourceType,
    resourceId: number,
    roleCodes: string[]
  ): Promise<PermissionVo.ResourcePermissionType> {
    const roleInSql = roleCodes.map(() => '?').join(',')
    const sql = `
      select
        case
          when max(case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end) = 3 then 'manage'
          when max(case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end) = 2 then 'edit'
          when max(case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end) = 1 then 'view'
          else 'none'
        end as permissionType
      from resource_role_permission rrp
      inner join role r on r.id = rrp.role_id and r.is_deleted = 0 and r.status = 1
      where rrp.resource_type = ? and rrp.resource_id = ? and r.role_code in (${roleInSql})`
    const result = await this.exe<Array<{ permissionType: PermissionVo.ResourcePermissionType }>>(sql, [
      resourceType,
      resourceId,
      ...roleCodes
    ])
    return result?.[0]?.permissionType || 'none'
  }
}
