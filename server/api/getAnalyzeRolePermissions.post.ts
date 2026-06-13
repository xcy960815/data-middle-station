import { PermissionService } from '@/server/service/permissionService'

const permissionService = new PermissionService()

/**
 * @desc 获取分析详情 API 处理器 (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<PermissionVo.AnalyzeRolePermissionsResponse>>>(async (event) => {
  try {
    const requestBody = await readBody<PermissionDto.GetAnalyzeRolePermissionsRequest>(event)
    const analyzeId = Number(requestBody.analyzeId)
    if (!Number.isInteger(analyzeId) || analyzeId <= 0) {
      return ApiResponse.error('分析ID不合法')
    }
    const permissions = await permissionService.getAnalyzeRolePermissions(analyzeId)
    return ApiResponse.success(permissions)
  } catch (error) {
    return ApiResponse.error((error as Error).message)
  }
})
