import { ResourcePermissionService } from '@/server/service/resourcePermissionService'

/**
 * @class PermissionService
 * @extends ResourcePermissionService
 * @description 权限服务类，专门用于针对特定分析图表资源的权限配置与管理，继承并封装了底层的通用资源角色权限服务。
 */
export class PermissionService extends ResourcePermissionService {
  /**
   * 获取指定分析看板的所有角色权限配置
   * @public
   * @param {number} analyzeId 分析看板 ID
   * @returns {Promise<PermissionVo.AnalyzeRolePermissionsResponse>} 包含角色与对应权限操作配置的响应对象
   */
  public async getAnalyzeRolePermissions(analyzeId: number): Promise<PermissionVo.AnalyzeRolePermissionsResponse> {
    const permissions = await this.getResourceRolePermissions({
      resourceType: 'analyze',
      resourceId: analyzeId
    })
    return {
      ...permissions,
      analyzeId
    }
  }

  /**
   * 更新指定分析看板的角色权限配置
   * @public
   * @param {PermissionDto.UpdateAnalyzeRolePermissionsRequest} updateRequest 更新分析看板权限请求参数
   * @returns {Promise<PermissionVo.AnalyzeRolePermissionsResponse>} 更新后的角色与对应权限操作配置的响应对象
   */
  public async updateAnalyzeRolePermissions(
    updateRequest: PermissionDto.UpdateAnalyzeRolePermissionsRequest
  ): Promise<PermissionVo.AnalyzeRolePermissionsResponse> {
    const permissions = await this.updateResourceRolePermissions({
      resourceType: 'analyze',
      resourceId: updateRequest.analyzeId,
      permissions: updateRequest.permissions
    })
    return {
      ...permissions,
      analyzeId: updateRequest.analyzeId
    }
  }
}
