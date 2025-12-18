# Store 类型定义

本目录包含应用程序中使用的 Pinia store 的 TypeScript 类型定义 (`.d.ts` 文件)。这些定义确保了全局状态管理的类型安全。

## 目录结构

| 文件名                  | 描述                                                                           |
| ----------------------- | ------------------------------------------------------------------------------ |
| `AnalyzeStore.d.ts`     | 定义分析 store 的类型，包括图表类型、分析状态（名称、描述、数据）和加载状态。  |
| `BaseStore.d.ts`        | 提供基础 store 结构的通用类型定义，包括 State、Getters 和 Actions 的辅助类型。 |
| `ChartConfigStore.d.ts` | 定义图表配置设置的类型。                                                       |
| `ColumnStore.d.ts`      | 定义分析视图中管理数据列的类型。                                               |
| `Common.d.ts`           | 包含多个 store 之间使用的通用共享类型定义。                                    |
| `DimensionStore.d.ts`   | 定义管理数据维度的类型。                                                       |
| `FilterStore.d.ts`      | 定义数据过滤操作的类型。                                                       |
| `GroupStore.d.ts`       | 定义数据分组操作的类型。                                                       |
| `HomePageStore.d.ts`    | 定义与主页状态相关的类型。                                                     |
| `OrderStore.d.ts`       | 定义数据排序和顺序的类型。                                                     |
| `UserStore.d.ts`        | 定义用户 store 的类型，包括用户个人资料信息（ID、姓名、头像）。                |

## 使用说明

这些命名空间是全局声明的，可以在整个应用程序中使用，以便为相应的 Pinia store 的 state、getters 和 actions 提供类型支持。

Store 文件中的使用示例：

```typescript
// 在 Pinia store 定义中
export const useUserStore = defineStore('user', {
  state: (): UserStore.UserState => ({
    userId: '',
    userName: '',
    avatar: ''
  }),
  getters: {
    // ...
  },
  actions: {
    // ...
  }
})
```
