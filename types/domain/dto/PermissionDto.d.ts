declare namespace PermissionDto {
  type AnalyzePermissionType = import('@/shared/domainTypes').AnalyzePermissionType

  type GetAnalyzeRolePermissionsRequest = {
    analyzeId: number
  }

  type AnalyzeRolePermissionRequestItem = {
    roleId: number
    permissionType: AnalyzePermissionType
  }

  type UpdateAnalyzeRolePermissionsRequest = {
    analyzeId: number
    permissions: AnalyzeRolePermissionRequestItem[]
  }
}
