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

/**
 * @desc 资源权限服务，负责资源级别的权限校验与管理
 */
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

  /**
   * @desc 获取角色列表
   * @returns 角色列表
   */
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

  /**
   * @desc 获取指定资源的角色权限列表
   * @param request 查询参数
   * @returns 资源角色权限列表
   */
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

  /**
   * @desc 更新指定资源的角色权限配置
   * @param request 更新请求参数
   * @returns 更新后的资源角色权限列表
   */
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

  /**
   * @desc 校验当前用户对指定资源的最低权限
   * @param options 校验参数（资源类型、资源 ID、所需权限级别）
   * @returns 当前用户对该资源的实际权限类型
   */
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

  /**
   * @desc 获取当前用户对指定资源的权限级别
   * @param resourceType 资源类型
   * @param resourceId 资源 ID
   * @param currentUserName 当前用户名
   * @param roleCodes 用户角色编码列表
   * @returns 权限类型
   */
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

    return await this.permissionMapper.getMaxPermissionByRoles(resourceType, resourceId, roleCodes)
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
