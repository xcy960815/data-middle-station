import { PermissionService } from '@/server/service/permissionService'

const permissionService = new PermissionService()

/**
 * @desc 更新分析配置 API 处理器 (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<PermissionVo.AnalyzeRolePermissionsResponse>>>(async (event) => {
  try {
    const updateRequest = await readBody<PermissionDto.UpdateAnalyzeRolePermissionsRequest>(event)
    const permissions = await permissionService.updateAnalyzeRolePermissions(updateRequest)
    return ApiResponse.success(permissions)
  } catch (error) {
    return ApiResponse.error((error as Error).message)
  }
})
