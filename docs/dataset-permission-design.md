# 数据集 (Dataset) 模块权限接入设计文档

## 1. 背景与目标

当前系统中，**分析 (Analyze)** 和 **看板 (Dashboard)** 模块已经接入了一套基于 `resource_role_permission` 表的细粒度角色权限体系（包含 `none`, `view`, `edit`, `manage` 级别）。
然而，**数据集 (Dataset)** 模块目前的权限控制非常粗放：

- 列表与详情接口无权限校验（任何登录用户均可查看）。
- 创建、更新、删除接口仅允许 `admin` 角色操作。

本设计的**目标**是将数据集模块完全接入系统中已有的 `resource_role_permission` 资源角色权限体系，废除粗放的 Admin 限制，实现**按数据源所有者及角色分配的细粒度权限管控**，使得该模块的权限行为与 Analyze 和 Dashboard 保持高度一致。

---

## 2. 现有底层支持机制复用

1. **资源类型定义已存在**：
   在 `shared/resourcePermissionTypes.ts` 中，`PERMISSION_RESOURCE_TYPES` 已经包含了 `'dataset'`。
2. **权限记录表已存在**：
   底层使用通用的 `resource_role_permission` 表进行持久化，无需为数据集单独建表。
3. **Owner 机制已存在**：
   `dataset` 表中已拥有 `created_by` 字段，可以作为判断 Owner 的依据（Owner 天然拥有 `manage` 权限）。

---

## 3. 具体改造执行计划

### 3.1 后端服务层改造 (`server/service/datasetService.ts`)

全面移除现有的 `this.assertCurrentUserAdmin()` 限制，改为基于 `ResourcePermissionService` 的细粒度控制：

- **创建数据集 (`createDataset`)**
  - 取消 Admin 限制，任何登录用户均可创建数据集。
  - 创建后，该用户自动成为数据集的 owner (`created_by`)，天然获得 `manage` 权限。
- **读取数据集详情 (`getDataset`) & 预览数据 (`previewDataset`, `previewDatasetSql`)**
  - 增加校验：`await this.assertResourcePermission({ resourceType: 'dataset', resourceId, requiredPermission: 'view' })`。
- **更新数据集 (`updateDataset`)**
  - 增加校验：`await this.assertResourcePermission({ resourceType: 'dataset', resourceId, requiredPermission: 'edit' })`。
- **删除数据集 (`deleteDataset`)**
  - 增加校验：`await this.assertResourcePermission({ resourceType: 'dataset', resourceId, requiredPermission: 'manage' })`。

### 3.2 权限基础服务适配 (`server/service/resourcePermissionService.ts`)

为了让 `assertResourcePermission` 能够正确识别数据集的 Owner，需要修改 `getResourceOwnerName` 方法，增加对 `dataset` 的支持：

```typescript
private async getResourceOwnerName(resourceType: PermissionVo.ResourceType, resourceId: number): Promise<string> {
  if (resourceType === 'analyze') { ... }
  if (resourceType === 'dashboard') { ... }
  if (resourceType === 'dataset') {
    // 需引入 DatasetMapper 并实例化
    const dataset = await this.datasetMapper.getDataset({ id: resourceId });
    return dataset?.createdBy || '';
  }
  throw new Error('暂不支持该资源类型');
}
```

### 3.3 数据访问层改造 (`server/mapper/datasetMapper.ts`)

重构数据集列表查询逻辑（参考 `DashboardMapper` 的实现方式）：

1.  **权限过滤**：非 Admin 用户查询列表时，只能看到**自己创建的 (`created_by = currentUser`)** 或者 **通过 `resource_role_permission` 表拥有对应权限的**数据集。
2.  **权限计算注入**：在列表查询的 SQL 中，`JOIN role` 和 `resource_role_permission`，使用 `CASE WHEN` 动态计算出当前用户对每个数据集的最高权限级别（`manage`, `edit`, `view`, `none`），并将其作为 `datasetPermission` 字段一并返回给前端。
3.  需同步更新 `DatasetVo.DatasetListItem` (位于 `types/domain/vo/DatasetVo.d.ts`) 以包含 `datasetPermission?: PermissionVo.ResourcePermissionType` 字段。

### 3.4 前端 UI 与交互改造

**列表页 (`pages/dataset/index.vue`)**

- **权限徽章显示**：根据每条记录返回的 `datasetPermission`，在卡片或列表中展示对应的权限状态（只读、可编辑、可管理）。
- **操作按钮权限控制**：
  - 编辑按钮：当权限 `>= edit` 时显示。
  - 删除按钮：当权限 `== manage` 时显示。
  - **权限配置按钮**：为 `manage` 权限的用户提供一个齿轮/权限管理按钮，点击后复用系统中已有的权限分配弹窗（传入 `resourceType: 'dataset'` 和对应的 `resourceId`）。

**详情/编辑页 (`pages/dataset/[id].vue`)**

- 计算出当前的编辑权限。若权限低于 `edit`，则将数据集配置表单和 SQL 编辑器置为只读模式（禁用保存按钮、隐藏编辑控件等）。

---

## 4. 依赖 API 列表（直接复用）

前端弹窗进行权限分配时，直接调用以下现成接口（无需新开发）：

- `POST /api/getResourceRolePermissions` (传递 `{ resourceType: 'dataset', resourceId: id }`)
- `POST /api/updateResourceRolePermissions` (传递 `{ resourceType: 'dataset', resourceId: id, permissions: [...] }`)

---

## 5. 测试验收标准

1.  **普通用户新建**：非管理员用户 A 成功创建数据集 D1，且在列表中看到 D1 标有“可管理”权限。
2.  **权限隔离**：非管理员用户 B 登录后，在其列表中**无法看到**数据集 D1（除非 A 授予其查看或以上权限）。
3.  **权限授予与生效**：用户 A 将 D1 的 `view` 权限授予“分析师”角色。所有角色为“分析师”的用户登录后，能够看到 D1（带有“只读”徽标），可以预览数据，但无法保存更改或删除 D1。
4.  **Admin 特权**：管理员用户无论是否被授权，均能看到所有数据集，且始终拥有 `manage` 权限。
