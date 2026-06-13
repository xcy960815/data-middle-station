# 权限弹窗通用化改造与详情页权限入口补充

## 1. 背景

在数据集模块权限接入完成后，分析、看板、数据集三个模块的权限配置弹窗存在以下问题：

- **代码重复**：三个模块的列表页各自实现了一套完整的权限弹窗逻辑（内联 `<el-dialog>`、权限列表状态、API 调用函数、弹窗 CSS），代码高度相似但各自独立维护。
- **入口缺失**：权限配置按钮仅存在于列表页的卡片操作上，进入详情页后没有权限配置的入口。用户必须返回列表页才能调整权限，操作路径不够便捷。

## 2. 改造内容

### 2.1 抽取通用 ResourcePermissionDialog 组件

新建 `components/resource-permission-dialog/index.vue`，将三个模块重复的权限弹窗逻辑统一收敛到一个组件中。

组件设计：

- **Props**：`resourceType`（资源类型：analyze / dashboard / dataset）和可选的 `resourceLabel`（自定义资源标签文本）
- **Emits**：`saved`（授权保存成功后触发，供父组件刷新列表）
- **Expose**：`open(id: number, name?: string)` 方法，供外部调用打开弹窗
- **内部职责**：自行管理弹窗可见状态、loading、saving、权限列表获取（`getResourceRolePermissions`）与保存（`updateResourceRolePermissions`）的完整 API 调用流程
- **样式内置**：弹窗布局、角色行、下拉选择等 CSS 全部内聚在组件的 `<style scoped>` 中

### 2.2 重构三个模块的列表页

对 `pages/analyze/index.vue`、`pages/dashboard/index.vue`、`pages/dataset/index.vue` 分别执行以下改造：

1. **模板替换**：将内联的 `<el-dialog v-model="permissionDialogVisible">` 替换为 `<ResourcePermissionDialog ref="permissionDialogRef" resource-type="xxx" @saved="refreshList" />`
2. **状态清理**：移除各页面中的 `permissionDialogVisible`、`permissionLoading`、`permissionSaving`、`permissionResourceId`、`permissionResourceName`、`permissionList`、`permissionDialogTitle` 等冗余状态变量
3. **函数精简**：将 30+ 行的 `handleOpenPermissionDialog`（含完整 API 调用）和 `handleSavePermissions` 替换为简单的 `permissionDialogRef?.open(id, name)` 一行调用
4. **CSS 清理**：移除各页面中重复的 `.permission-dialog`、`.permission-row`、`.permission-role`、`.permission-select` 等样式规则

### 2.3 为三个模块的详情页补充权限配置入口

在三个详情页的 header 区域（`custom-header` 的 `#header-right` 插槽）增加权限配置按钮，仅在用户拥有 `manage` 权限时显示。

**分析详情页** (`pages/analyze/[id].vue`)：

- 修改 `useAnalyzeHandler.ts`，新增 `analyzePermission` ref，在 `getAnalyze` 方法中从 API 响应捕获权限信息并返回
- 详情页中通过 `canManageAnalyze` 计算属性控制按钮的显示

**看板详情页** (`pages/dashboard/[id].vue`)：

- 在 `useDashboard.ts` composable 中新增 `canManageDashboard` 计算属性（基于 `activeDashboard.dashboardPermission`），并导出
- 详情页中从 composable 解构 `canManageDashboard` 控制按钮显示

**数据集详情页** (`pages/dataset/[id].vue`)：

- 利用已有的 `datasetPermission` ref 和 `permissionLevelMap` 新增 `canManageDataset` 计算属性
- 新建数据集时（`isNewDataset`）不显示权限按钮

## 3. 涉及文件清单

| 文件                                              | 改动类型 | 说明                                                     |
| ------------------------------------------------- | -------- | -------------------------------------------------------- |
| `components/resource-permission-dialog/index.vue` | 新增     | 通用权限弹窗组件                                         |
| `pages/analyze/index.vue`                         | 重构     | 移除内联权限弹窗，改用通用组件                           |
| `pages/dashboard/index.vue`                       | 重构     | 移除内联权限弹窗，改用通用组件                           |
| `pages/dataset/index.vue`                         | 重构     | 移除内联权限弹窗，改用通用组件（数据集权限接入时已完成） |
| `pages/analyze/[id].vue`                          | 修改     | 添加 header-right 权限按钮和通用弹窗                     |
| `pages/analyze/useAnalyzeHandler.ts`              | 修改     | 新增 analyzePermission ref 并暴露                        |
| `pages/dashboard/[id].vue`                        | 修改     | 添加 header-right 权限按钮和通用弹窗                     |
| `pages/dashboard/composables/useDashboard.ts`     | 修改     | 新增 canManageDashboard 计算属性并导出                   |
| `pages/dataset/[id].vue`                          | 修改     | 添加 header-right 权限按钮和通用弹窗                     |

## 4. 遗留事项

- **SQL 层重复**：三个 Mapper（`analyzeMapper`、`dashboardMapper`、`datasetMapper`）中的权限 JOIN、CASE WHEN 计算、过滤逻辑仍然各自实现。可进一步抽取为 `buildPermissionSelectSql` / `buildPermissionFilterClause` 等通用 SQL 构建工具函数。
- **遗留权限表**：数据库中存在一张 `analyze_role_permission` 遗留表，代码中已无任何引用，可在合适时机清理。
