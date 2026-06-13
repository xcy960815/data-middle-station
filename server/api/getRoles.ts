import { PermissionService } from '@/server/service/permissionService'

const permissionService = new PermissionService()

/**
 * @desc API 处理器 - getRoles.ts (ALL)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<PermissionVo.RoleListResponse>>>(async () => {
  try {
    const roles = await permissionService.getRoles()
    return ApiResponse.success(roles)
  } catch (error) {
    return ApiResponse.error((error as Error).message)
  }
})
