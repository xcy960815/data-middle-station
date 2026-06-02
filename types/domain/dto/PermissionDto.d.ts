declare namespace PermissionDto {
  type ResourceType = import('@/shared/domainTypes').ResourceType
  type ResourcePermissionType = import('@/shared/domainTypes').ResourcePermissionType
  type AnalyzePermissionType = ResourcePermissionType

  type GetResourceRolePermissionsRequest = {
    resourceType: ResourceType
    resourceId: number
  }

  type ResourceRolePermissionRequestItem = {
    roleId: number
    permissionType: ResourcePermissionType
  }

  type UpdateResourceRolePermissionsRequest = {
    resourceType: ResourceType
    resourceId: number
    permissions: ResourceRolePermissionRequestItem[]
  }

  type GetAnalyzeRolePermissionsRequest = {
    analyzeId: number
  }

  type AnalyzeRolePermissionRequestItem = ResourceRolePermissionRequestItem

  type UpdateAnalyzeRolePermissionsRequest = {
    analyzeId: number
    permissions: AnalyzeRolePermissionRequestItem[]
  }
}
