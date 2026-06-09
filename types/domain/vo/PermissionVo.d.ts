declare namespace PermissionVo {
  type ResourceType = import('@/shared/resourcePermissionTypes').PermissionResourceType
  type ResourcePermissionType = import('@/shared/resourcePermissionTypes').ResourcePermissionLevel
  type AnalyzePermissionType = ResourcePermissionType

  type RoleItem = {
    id: number
    roleCode: string
    roleName: string
  }

  type ResourceRolePermissionItem = RoleItem & {
    permissionType: ResourcePermissionType
  }

  type AnalyzeRolePermissionItem = ResourceRolePermissionItem

  type RoleListResponse = {
    list: RoleItem[]
  }

  type ResourceRolePermissionsResponse = {
    resourceType: ResourceType
    resourceId: number
    list: ResourceRolePermissionItem[]
  }

  type AnalyzeRolePermissionsResponse = ResourceRolePermissionsResponse & {
    analyzeId: number
  }
}
