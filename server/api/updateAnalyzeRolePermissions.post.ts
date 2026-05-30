import { PermissionService } from '@/server/service/permissionService'

const permissionService = new PermissionService()

export default defineEventHandler<Promise<ApiResponseI<PermissionVo.AnalyzeRolePermissionsResponse>>>(async (event) => {
  try {
    const updateRequest = await readBody<PermissionDto.UpdateAnalyzeRolePermissionsRequest>(event)
    const permissions = await permissionService.updateAnalyzeRolePermissions(updateRequest)
    return ApiResponse.success(permissions)
  } catch (error) {
    return ApiResponse.error((error as Error).message)
  }
})
