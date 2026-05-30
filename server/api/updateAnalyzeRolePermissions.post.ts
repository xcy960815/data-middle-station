import { PermissionService } from '@/server/service/permissionService'

const permissionService = new PermissionService()

export default defineEventHandler<Promise<ApiResponseI<PermissionVo.UpdateAnalyzeRolePermissionsOptions>>>(
  async (event) => {
    try {
      const body = await readBody<PermissionDto.UpdateAnalyzeRolePermissionsOptions>(event)
      const permissions = await permissionService.updateAnalyzeRolePermissions(body)
      return ApiResponse.success(permissions)
    } catch (error) {
      return ApiResponse.error((error as Error).message)
    }
  }
)
