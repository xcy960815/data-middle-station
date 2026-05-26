import { PermissionService } from '@/server/service/permissionService'

const permissionService = new PermissionService()

export default defineEventHandler<Promise<ApiResponseI<PermissionVo.GetAnalyzeRolePermissionsOptions>>>(
  async (event) => {
    try {
      const body = await readBody<{ analyzeId: number }>(event)
      const analyzeId = Number(body.analyzeId)
      if (!Number.isInteger(analyzeId) || analyzeId <= 0) {
        return ApiResponse.error('分析ID不合法')
      }
      const token = JwtUtils.getTokenFromCookie(event)
      const userInfo = JwtUtils.verifyToken(token as string)
      const permissions = await permissionService.getAnalyzeRolePermissions(analyzeId, {
        userName: userInfo.userName,
        roleCodes: userInfo.roleCodes || []
      })
      return ApiResponse.success(permissions)
    } catch (error) {
      return ApiResponse.error((error as Error).message)
    }
  }
)
