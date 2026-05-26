declare namespace PermissionDto {
  type AnalyzePermissionType = 'none' | 'view' | 'edit' | 'manage'

  type UpdateAnalyzeRolePermissionItem = {
    roleId: number
    permissionType: AnalyzePermissionType
  }

  type UpdateAnalyzeRolePermissionsOptions = {
    analyzeId: number
    permissions: UpdateAnalyzeRolePermissionItem[]
  }
}
