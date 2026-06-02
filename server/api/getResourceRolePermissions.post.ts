import { ResourcePermissionService } from '@/server/service/resourcePermissionService'

const resourcePermissionService = new ResourcePermissionService()

export default defineEventHandler<Promise<ApiResponseI<PermissionVo.ResourceRolePermissionsResponse>>>(
  async (event) => {
    try {
      const requestBody = await readBody<PermissionDto.GetResourceRolePermissionsRequest>(event)
      const permissions = await resourcePermissionService.getResourceRolePermissions(requestBody)
      return ApiResponse.success(permissions)
    } catch (error) {
      return ApiResponse.error((error as Error).message)
    }
  }
)
