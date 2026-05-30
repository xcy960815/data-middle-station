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
      const permissions = await permissionService.getAnalyzeRolePermissions(analyzeId)
      return ApiResponse.success(permissions)
    } catch (error) {
      return ApiResponse.error((error as Error).message)
    }
  }
)
