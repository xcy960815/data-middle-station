# Plugins 类型声明文件夹

此文件夹包含 `plugins` 目录下各个插件模块的 TypeScript 类型声明文件。

## 📁 文件结构

| 声明文件            | 对应插件                 | 功能描述                       |
| ------------------- | ------------------------ | ------------------------------ |
| `indexdb.d.ts`      | `indexdb.client.ts`      | IndexedDB 数据库操作的类型定义 |
| `context-menu.d.ts` | `context-menu.client.ts` | 右键菜单组件和指令的类型定义   |
| `table-sticky.d.ts` | `table-stick.client.ts`  | 表格粘性头部指令的类型定义     |
| `web-worker.d.ts`   | `webworker.client.ts`    | Web Worker 增强实现的类型定义  |
| `nuxt-app.d.ts`     | -                        | Nuxt 应用全局类型扩展          |

## 🔧 插件功能说明

### IndexedDB 插件 (`indexdb.d.ts`)

- **功能**: 提供浏览器本地数据库操作的完整封装
- **主要类型**:
  - `WindowWithIndexedDB`: 跨浏览器兼容的 IndexedDB 接口
  - `TableConfig`: 数据表配置结构
  - `QueryResult`: 查询结果数据结构
  - `DataRecord`: 通用数据记录类型

### 右键菜单插件 (`context-menu.d.ts`)

- **功能**: 提供自定义右键菜单组件和Vue指令
- **主要类型**:
  - `ContextMenuElement`: 右键菜单绑定元素接口
  - `TriggerType`: 触发方式类型（右键/左键点击）
  - `ContextMenuOptions`: 菜单配置选项
  - `ContextMenuInstance`: 菜单实例接口

### 表格粘性头部插件 (`table-sticky.d.ts`)

- **功能**: 实现表格头部固定效果的Vue指令
- **主要类型**:
  - `DirectiveBindingValue`: 指令绑定值配置
  - `StickyConfig`: 粘性效果配置参数
  - `Option`: 指令选项接口

### Web Worker 插件 (`web-worker.d.ts`)

- **功能**: 增强的 Web Worker 实现，支持任务队列和统计
- **主要类型**:
  - `Action`: Worker 任务动作接口
  - `WorkerOptions`: Worker 配置选项
  - `WorkerResult`: 执行结果接口
  - `WorkerStats`: 执行统计信息

## 📋 其他插件（无声明文件）

以下插件使用标准库类型或第三方库类型，无需额外声明：

- `socket.client.ts` - Socket.IO 客户端封装
- `common-watermark.client.ts` - 页面水印功能
- `element-plus.ts` - Element Plus UI 库注册
- `element-iconfont.ts` - Element 图标字体注册
- `icon-park.client.ts` - IconPark 图标库注册
- `monaco-worker.client.ts` - Monaco 编辑器 Worker 配置

## 📝 使用说明

1. **类型导入**: 在需要使用插件类型的地方，直接使用命名空间访问类型

   ```typescript
   // 使用 IndexedDB 类型
   const config: IndexDB.TableConfig = { ... }

   // 使用右键菜单类型
   const options: ContextMenu.ContextMenuOptions = { ... }
   ```

2. **类型扩展**: 需要扩展插件类型时，在对应的 `.d.ts` 文件中添加新的接口定义

3. **维护原则**:
   - 保持类型定义与实现文件同步
   - 使用命名空间避免类型污染
   - 提供详细的 JSDoc 注释

## 🔄 版本维护

当对应的插件实现发生变更时，请及时更新相应的类型声明文件，确保类型安全。
