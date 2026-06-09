import { AnalyzeMapper } from '@/server/mapper/analyzeMapper'
import { DashboardMapper } from '@/server/mapper/dashboardMapper'
import { PermissionMapper } from '@/server/mapper/permissionMapper'
import { BaseService } from '@/server/service/baseService'
import { PERMISSION_RESOURCE_TYPES } from '@/shared/resourcePermissionTypes'

type PermissionLevel = Exclude<PermissionVo.ResourcePermissionType, 'none'>

const PERMISSION_TYPES = new Set<PermissionVo.ResourcePermissionType>(['none', 'view', 'edit', 'manage'])
const RESOURCE_TYPE_SET = new Set<PermissionVo.ResourceType>(PERMISSION_RESOURCE_TYPES)
const PERMISSION_LEVEL_MAP: Record<PermissionVo.ResourcePermissionType, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3
}

export class ResourcePermissionService extends BaseService {
  private permissionMapper: PermissionMapper
  private analyzeMapper: AnalyzeMapper
  private dashboardMapper: DashboardMapper

  constructor() {
    super()
    this.permissionMapper = new PermissionMapper()
    this.analyzeMapper = new AnalyzeMapper()
    this.dashboardMapper = new DashboardMapper()
  }

  public async getRoles(): Promise<PermissionVo.RoleListResponse> {
    try {
      const list = await this.permissionMapper.getRoles()
      return { list }
    } catch (_error) {
      return {
        list: [{ id: 1, roleCode: 'admin', roleName: '管理员' }]
      }
    }
  }

  public async getResourceRolePermissions(
    request: PermissionDto.GetResourceRolePermissionsRequest
  ): Promise<PermissionVo.ResourceRolePermissionsResponse> {
    const resourceType = this.normalizeResourceType(request.resourceType)
    const resourceId = this.normalizeResourceId(request.resourceId)
    await this.assertResourcePermission({ resourceType, resourceId, requiredPermission: 'manage' })

    const [{ list: roles }, permissions] = await Promise.all([
      this.getRoles(),
      this.permissionMapper.getResourceRolePermissions(resourceType, resourceId).catch(() => [])
    ])
    const permissionMap = new Map(permissions.map((item) => [item.roleId, item.permissionType]))

    return {
      resourceType,
      resourceId,
      list: roles.map((role) => ({
        ...role,
        permissionType: this.normalizePermissionType(permissionMap.get(role.id))
      }))
    }
  }

  public async updateResourceRolePermissions(
    request: PermissionDto.UpdateResourceRolePermissionsRequest
  ): Promise<PermissionVo.ResourceRolePermissionsResponse> {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('未获取到当前用户信息')
    }
    const resourceType = this.normalizeResourceType(request.resourceType)
    const resourceId = this.normalizeResourceId(request.resourceId)
    await this.assertResourcePermission({ resourceType, resourceId, requiredPermission: 'manage' })

    const normalizedPermissions = request.permissions
      .map((item) => ({
        roleId: Number(item.roleId),
        permissionType: this.normalizePermissionType(item.permissionType)
      }))
      .filter(
        (
          item
        ): item is {
          roleId: number
          permissionType: Exclude<PermissionVo.ResourcePermissionType, 'none'>
        } => Number.isInteger(item.roleId) && item.roleId > 0 && item.permissionType !== 'none'
      )

    await this.permissionMapper.replaceResourceRolePermissions(
      resourceType,
      resourceId,
      normalizedPermissions,
      currentUser.userName
    )
    return await this.getResourceRolePermissions({ resourceType, resourceId })
  }

  public async assertResourcePermission(options: {
    resourceType: PermissionVo.ResourceType
    resourceId: number
    requiredPermission: PermissionLevel
  }): Promise<PermissionVo.ResourcePermissionType> {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      return 'manage'
    }
    const permission = await this.getCurrentUserResourcePermission(
      options.resourceType,
      options.resourceId,
      currentUser.userName,
      currentUser.roleCodes || []
    )
    if (PERMISSION_LEVEL_MAP[permission] < PERMISSION_LEVEL_MAP[options.requiredPermission]) {
      throw new Error('无权访问该资源')
    }
    return permission
  }

  public async getCurrentUserResourcePermission(
    resourceType: PermissionVo.ResourceType,
    resourceId: number,
    currentUserName: string,
    roleCodes: string[] = []
  ): Promise<PermissionVo.ResourcePermissionType> {
    if (roleCodes.includes('admin')) {
      return 'manage'
    }

    const ownerName = await this.getResourceOwnerName(resourceType, resourceId)
    if (!ownerName) {
      throw new Error('资源不存在')
    }
    if (ownerName === currentUserName) {
      return 'manage'
    }

    if (roleCodes.length === 0) {
      return 'none'
    }

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
    const result = await this.permissionMapper.exe<Array<{ permissionType: PermissionVo.ResourcePermissionType }>>(
      sql,
      [resourceType, resourceId, ...roleCodes]
    )
    return result?.[0]?.permissionType || 'none'
  }

  private async getResourceOwnerName(resourceType: PermissionVo.ResourceType, resourceId: number): Promise<string> {
    if (resourceType === 'analyze') {
      const analyze = await this.analyzeMapper.getAnalyze({ id: resourceId })
      return analyze?.createdBy || ''
    }
    if (resourceType === 'dashboard') {
      const dashboard = await this.dashboardMapper.getDashboardWithoutAccess(resourceId)
      return dashboard?.createdBy || ''
    }
    throw new Error('暂不支持该资源类型')
  }

  private normalizeResourceType(resourceType: string): PermissionVo.ResourceType {
    if (RESOURCE_TYPE_SET.has(resourceType as PermissionVo.ResourceType)) {
      return resourceType as PermissionVo.ResourceType
    }
    throw new Error('资源类型不合法')
  }

  private normalizeResourceId(resourceId: number | string): number {
    const normalizedResourceId = Number(resourceId)
    if (!Number.isInteger(normalizedResourceId) || normalizedResourceId <= 0) {
      throw new Error('资源ID不合法')
    }
    return normalizedResourceId
  }

  private normalizePermissionType(permissionType?: string): PermissionVo.ResourcePermissionType {
    if (permissionType && PERMISSION_TYPES.has(permissionType as PermissionVo.ResourcePermissionType)) {
      return permissionType as PermissionVo.ResourcePermissionType
    }
    return 'none'
  }
}
