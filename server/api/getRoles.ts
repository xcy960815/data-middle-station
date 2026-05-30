import { PermissionService } from '@/server/service/permissionService'

const permissionService = new PermissionService()

export default defineEventHandler<Promise<ApiResponseI<PermissionVo.RoleListResponse>>>(async () => {
  try {
    const roles = await permissionService.getRoles()
    return ApiResponse.success(roles)
  } catch (error) {
    return ApiResponse.error((error as Error).message)
  }
})
