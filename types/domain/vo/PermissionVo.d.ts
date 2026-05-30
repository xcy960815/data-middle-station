declare namespace PermissionVo {
  type AnalyzePermissionType = import('@/shared/domainTypes').AnalyzePermissionType

  type RoleItem = {
    id: number
    roleCode: string
    roleName: string
  }

  type AnalyzeRolePermissionItem = RoleItem & {
    permissionType: AnalyzePermissionType
  }

  type RoleListResponse = {
    list: RoleItem[]
  }

  type AnalyzeRolePermissionsResponse = {
    analyzeId: number
    list: AnalyzeRolePermissionItem[]
  }
}
