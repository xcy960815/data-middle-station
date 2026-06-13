import { ResourcePermissionService } from '@/server/service/resourcePermissionService'

const resourcePermissionService = new ResourcePermissionService()

/**
 * @desc API 处理器 - updateResourceRolePermissions.post.ts (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<PermissionVo.ResourceRolePermissionsResponse>>>(
  async (event) => {
    try {
      const requestBody = await readBody<PermissionDto.UpdateResourceRolePermissionsRequest>(event)
      const permissions = await resourcePermissionService.updateResourceRolePermissions(requestBody)
      return ApiResponse.success(permissions)
    } catch (error) {
      return ApiResponse.error((error as Error).message)
    }
  }
)
