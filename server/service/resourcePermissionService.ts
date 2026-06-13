import { AnalyzeMapper } from '@/server/mapper/analyzeMapper'
import { DashboardMapper } from '@/server/mapper/dashboardMapper'
import { PermissionMapper } from '@/server/mapper/permissionMapper'
import { BaseService } from '@/server/service/baseService'
import { PERMISSION_RESOURCE_TYPES } from '@/shared/resourcePermissionTypes'

type PermissionLevel = Exclude<PermissionVo.ResourcePermissionType, 'none'>

/**
 * 权限类型集合
 * @type {Set<PermissionVo.ResourcePermissionType>}
 */
const PERMISSION_TYPES = new Set<PermissionVo.ResourcePermissionType>(['none', 'view', 'edit', 'manage'])

/**
 * 资源类型集合
 * @type {Set<PermissionVo.ResourceType>}
 */
const RESOURCE_TYPE_SET = new Set<PermissionVo.ResourceType>(PERMISSION_RESOURCE_TYPES)

/**
 * 权限等级权重映射表，用于比较权限高低
 * @type {Record<PermissionVo.ResourcePermissionType, number>}
 */
const PERMISSION_LEVEL_MAP: Record<PermissionVo.ResourcePermissionType, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3
}

/**
 * 资源权限服务类，负责资源级别的权限校验与管理
 */
export class ResourcePermissionService extends BaseService {
  /**
   * 权限数据访问层映射器
   * @private
   * @type {PermissionMapper}
   */
  private permissionMapper: PermissionMapper

  /**
   * 分析配置数据访问层映射器
   * @private
   * @type {AnalyzeMapper}
   */
  private analyzeMapper: AnalyzeMapper

  /**
   * 看板数据访问层映射器
   * @private
   * @type {DashboardMapper}
   */
  private dashboardMapper: DashboardMapper

  /**
   * 构造函数，初始化映射器
   */
  constructor() {
    super()
    this.permissionMapper = new PermissionMapper()
    this.analyzeMapper = new AnalyzeMapper()
    this.dashboardMapper = new DashboardMapper()
  }

  /**
   * 获取角色列表
   * @returns {Promise<PermissionVo.RoleListResponse>} 角色列表响应数据
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
   * 获取指定资源的角色权限列表
   * @param {PermissionDto.GetResourceRolePermissionsRequest} request 查询参数，包含资源类型和资源 ID
   * @returns {Promise<PermissionVo.ResourceRolePermissionsResponse>} 资源角色权限列表
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
   * 更新指定资源的角色权限配置
   * @param {PermissionDto.UpdateResourceRolePermissionsRequest} request 更新请求参数
   * @returns {Promise<PermissionVo.ResourceRolePermissionsResponse>} 更新后的资源角色权限列表
   * @throws {Error} 未获取到当前用户信息时抛出异常
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
   * 校验当前用户对指定资源的最低权限
   * @param {object} options 校验参数
   * @param {PermissionVo.ResourceType} options.resourceType 资源类型
   * @param {number} options.resourceId 资源 ID
   * @param {PermissionLevel} options.requiredPermission 所需权限级别
   * @returns {Promise<PermissionVo.ResourcePermissionType>} 当前用户对该资源的实际权限类型
   * @throws {Error} 无权访问该资源时抛出异常
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
   * 获取当前用户对指定资源的权限级别
   * @param {PermissionVo.ResourceType} resourceType 资源类型
   * @param {number} resourceId 资源 ID
   * @param {string} currentUserName 当前用户名
   * @param {string[]} [roleCodes=[]] 用户角色编码列表
   * @returns {Promise<PermissionVo.ResourcePermissionType>} 权限类型
   * @throws {Error} 资源不存在时抛出异常
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

  /**
   * 获取资源所有者的用户名
   * @private
   * @param {PermissionVo.ResourceType} resourceType 资源类型
   * @param {number} resourceId 资源 ID
   * @returns {Promise<string>} 所有者用户名，未找到返回空字符串
   * @throws {Error} 暂不支持该资源类型时抛出异常
   */
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

  /**
   * 规范化并校验资源类型是否合法
   * @private
   * @param {string} resourceType 资源类型
   * @returns {PermissionVo.ResourceType} 规范化后的资源类型
   * @throws {Error} 资源类型不合法时抛出异常
   */
  private normalizeResourceType(resourceType: string): PermissionVo.ResourceType {
    if (RESOURCE_TYPE_SET.has(resourceType as PermissionVo.ResourceType)) {
      return resourceType as PermissionVo.ResourceType
    }
    throw new Error('资源类型不合法')
  }

  /**
   * 规范化并校验资源 ID 是否合法
   * @private
   * @param {number | string} resourceId 资源 ID
   * @returns {number} 规范化后的数值 ID
   * @throws {Error} 资源 ID 不合法时抛出异常
   */
  private normalizeResourceId(resourceId: number | string): number {
    const normalizedResourceId = Number(resourceId)
    if (!Number.isInteger(normalizedResourceId) || normalizedResourceId <= 0) {
      throw new Error('资源ID不合法')
    }
    return normalizedResourceId
  }

  /**
   * 规范化并校验权限类型是否合法
   * @private
   * @param {string} [permissionType] 权限类型
   * @returns {PermissionVo.ResourcePermissionType} 规范化后的权限类型，如果不合法或未传入则返回 'none'
   */
  private normalizePermissionType(permissionType?: string): PermissionVo.ResourcePermissionType {
    if (permissionType && PERMISSION_TYPES.has(permissionType as PermissionVo.ResourcePermissionType)) {
      return permissionType as PermissionVo.ResourcePermissionType
    }
    return 'none'
  }
}
