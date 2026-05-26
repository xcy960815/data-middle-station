import { PermissionService } from '@/server/service/permissionService'

const permissionService = new PermissionService()

export default defineEventHandler<Promise<ApiResponseI<PermissionVo.UpdateAnalyzeRolePermissionsOptions>>>(
  async (event) => {
    try {
      const body = await readBody<PermissionDto.UpdateAnalyzeRolePermissionsOptions>(event)
      const token = JwtUtils.getTokenFromCookie(event)
      const userInfo = JwtUtils.verifyToken(token as string)
      const permissions = await permissionService.updateAnalyzeRolePermissions(
        body,
        userInfo.userName,
        userInfo.roleCodes || []
      )
      return ApiResponse.success(permissions)
    } catch (error) {
      return ApiResponse.error((error as Error).message)
    }
  }
)
