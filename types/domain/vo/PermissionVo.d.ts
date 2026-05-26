declare namespace PermissionVo {
  type AnalyzePermissionType = 'none' | 'view' | 'edit' | 'manage'

  type RoleOption = {
    id: number
    roleCode: string
    roleName: string
  }

  type AnalyzeRolePermissionItem = RoleOption & {
    permissionType: AnalyzePermissionType
  }

  type GetRolesOptions = {
    list: RoleOption[]
  }

  type GetAnalyzeRolePermissionsOptions = {
    analyzeId: number
    list: AnalyzeRolePermissionItem[]
  }

  type UpdateAnalyzeRolePermissionsOptions = {
    analyzeId: number
    list: AnalyzeRolePermissionItem[]
  }
}
