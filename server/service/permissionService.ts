import { AnalyzeMapper } from '@/server/mapper/analyzeMapper'
import { PermissionMapper } from '@/server/mapper/permissionMapper'
import { BaseService } from '@/server/service/baseService'

const PERMISSION_TYPES = new Set<PermissionVo.AnalyzePermissionType>(['none', 'view', 'edit', 'manage'])

export class PermissionService extends BaseService {
  private permissionMapper: PermissionMapper
  private analyzeMapper: AnalyzeMapper

  constructor() {
    super()
    this.permissionMapper = new PermissionMapper()
    this.analyzeMapper = new AnalyzeMapper()
  }

  public async getRoles(): Promise<PermissionVo.GetRolesOptions> {
    try {
      const list = await this.permissionMapper.getRoles()
      return { list }
    } catch (_error) {
      return {
        list: [{ id: 1, roleCode: 'admin', roleName: '管理员' }]
      }
    }
  }

  public async getAnalyzeRolePermissions(analyzeId: number): Promise<PermissionVo.GetAnalyzeRolePermissionsOptions> {
    const currentUser = this.getCurrentUser()
    if (currentUser) {
      await this.assertCanManageAnalyze(analyzeId, currentUser.userName, currentUser.roleCodes || [])
    }

    const [{ list: roles }, permissions] = await Promise.all([
      this.getRoles(),
      this.permissionMapper.getAnalyzeRolePermissions(analyzeId).catch(() => [])
    ])
    const permissionMap = new Map(permissions.map((item) => [item.roleId, item.permissionType]))

    return {
      analyzeId,
      list: roles.map((role) => ({
        ...role,
        permissionType: this.normalizePermissionType(permissionMap.get(role.id))
      }))
    }
  }

  public async updateAnalyzeRolePermissions(
    options: PermissionDto.UpdateAnalyzeRolePermissionsOptions
  ): Promise<PermissionVo.UpdateAnalyzeRolePermissionsOptions> {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('未获取到当前用户信息')
    }
    const operator = currentUser.userName
    const roleCodes = currentUser.roleCodes || []
    const analyze = await this.assertCanManageAnalyze(options.analyzeId, operator, roleCodes)
    if (!analyze) {
      throw new Error('分析不存在')
    }

    const normalizedPermissions = options.permissions
      .map((item) => ({
        roleId: Number(item.roleId),
        permissionType: this.normalizePermissionType(item.permissionType)
      }))
      .filter(
        (
          item
        ): item is {
          roleId: number
          permissionType: Exclude<PermissionVo.AnalyzePermissionType, 'none'>
        } => Number.isInteger(item.roleId) && item.roleId > 0 && item.permissionType !== 'none'
      )

    await this.permissionMapper.replaceAnalyzeRolePermissions(options.analyzeId, normalizedPermissions, operator)
    return await this.getAnalyzeRolePermissions(options.analyzeId)
  }

  private async assertCanManageAnalyze(analyzeId: number, operator: string, roleCodes: string[]) {
    const analyze = await this.analyzeMapper.getAnalyze({ id: analyzeId })
    if (!analyze) {
      throw new Error('分析不存在')
    }
    if (analyze.createdBy !== operator && !roleCodes.includes('admin')) {
      const currentPermission = await this.analyzeMapper.getAnalyzePermission(analyzeId, operator, roleCodes)
      if (currentPermission !== 'manage') {
        throw new Error('无权配置该分析授权')
      }
    }
    return analyze
  }

  private normalizePermissionType(permissionType?: string): PermissionVo.AnalyzePermissionType {
    if (permissionType && PERMISSION_TYPES.has(permissionType as PermissionVo.AnalyzePermissionType)) {
      return permissionType as PermissionVo.AnalyzePermissionType
    }
    return 'none'
  }
}
