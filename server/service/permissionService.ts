import { ResourcePermissionService } from '@/server/service/resourcePermissionService'

export class PermissionService extends ResourcePermissionService {
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
