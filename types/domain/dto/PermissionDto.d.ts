declare namespace PermissionDto {
  type AnalyzePermissionType = import('@/shared/domainTypes').AnalyzePermissionType

  type UpdateAnalyzeRolePermissionItem = {
    roleId: number
    permissionType: AnalyzePermissionType
  }

  type UpdateAnalyzeRolePermissionsOptions = {
    analyzeId: number
    permissions: UpdateAnalyzeRolePermissionItem[]
  }
}
