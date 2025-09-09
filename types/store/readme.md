# Store 类型声明文件夹

此文件夹包含应用程序状态管理的 TypeScript 类型声明文件，定义了各个 store 模块的状态、getters 和 actions。

## 📁 文件结构

| 声明文件           | 功能描述                       |
| ------------------ | ------------------------------ |
| `BaseStore.d.ts`   | 基础 Store 的通用类型定义      |
| `Analyse.d.ts`     | 数据分析和图表相关的状态管理   |
| `ChartConfig.d.ts` | 图表配置相关的状态管理         |
| `Column.d.ts`      | 数据列管理的状态和操作         |
| `Filter.d.ts`      | 数据过滤器的状态和操作         |
| `Dimension.d.ts`   | 数据维度管理的状态和操作       |
| `Group.d.ts`       | 数据分组管理的状态和操作       |
| `Order.d.ts`       | 数据排序管理的状态和操作       |
| `User.d.ts`        | 用户信息管理的状态和操作       |
| `Homepage.d.ts`    | 首页相关的状态管理             |
| `Common.d.ts`      | 公共类型定义（如拖拽数据结构） |

## 🔧 Store 模块说明

### 基础 Store (`BaseStore.d.ts`)

- **功能**: 提供所有 Store 的基础类型结构和约定
- **主要类型**:
  - `State<S>`: 通用状态类型
  - `GetterName<T>`: Getter 命名规范（get + 首字母大写）
  - `Getters<S, G>`: Getter 类型定义
  - `ActionName<T>`: Action 命名规范（set + 首字母大写）
  - `Actions<S, A>`: Action 类型定义

### 数据分析 Store (`Analyse.d.ts`)

- **功能**: 管理图表分析相关的状态和操作
- **主要类型**:
  - `ChartType`: 图表类型枚举（table、line、pie、interval）
  - `AnalyseState`: 分析状态结构
  - `AnalyseKey`: Store 键名类型

### 图表配置 Store (`ChartConfig.d.ts`)

- **功能**: 管理各类图表的配置信息
- **主要类型**:
  - `TableChartConfig`: 表格图表配置
  - `PieChartConfig`: 饼图配置
  - `IntervalChartConfig`: 柱状图配置
  - `LineChartConfig`: 折线图配置
  - `CommonChartConfig`: 图表公共配置
  - `PrivateChartConfig`: 图表私有配置

### 数据列 Store (`Column.d.ts`)

- **功能**: 管理数据源和数据列的选择与操作
- **主要类型**:
  - `ColumnOption`: 数据列选项结构
  - `DataSourceOption`: 数据源选项结构
  - `ColumnState`: 列管理状态
  - `ColumnActions`: 列操作方法

### 过滤器 Store (`Filter.d.ts`)

- **功能**: 管理数据过滤条件和聚合方式
- **主要类型**:
  - `FilterType`: 过滤类型枚举（等于、大于、包含等）
  - `FilterAggregationType`: 聚合方式枚举（原始值、计数、总计等）
  - `FilterOption`: 过滤器选项结构
  - `FilterState`: 过滤器状态

### 用户 Store (`User.d.ts`)

- **功能**: 管理用户登录状态和个人信息
- **主要类型**:
  - `UserState`: 用户状态（ID、姓名、头像）
  - `UserGetters`: 用户信息获取方法
  - `UserActions`: 用户信息更新方法

### 公共类型 (`Common.d.ts`)

- **功能**: 定义跨模块使用的公共类型
- **主要类型**:
  - `DragData<V>`: 拖拽数据结构，支持泛型

## 📋 使用说明

### 1. 类型导入和使用

```typescript
// 在组件中使用 Store 类型
export default defineComponent({
  setup() {
    // 使用 Analyse Store
    const analyseState: AnalyseStore.AnalyseState = {
      analyseName: '销售数据分析',
      chartType: 'table',
      chartData: []
      // ...其他属性
    }

    // 使用 Filter Store
    const filterOptions: FilterStore.FilterOption[] = [
      {
        columnName: 'sales',
        filterType: 'gt',
        filterValue: '1000',
        aggregationType: 'sum'
      }
    ]

    return {
      analyseState,
      filterOptions
    }
  }
})
```

### 2. Store 定义规范

```typescript
// 使用基础 Store 类型定义新的 Store
interface MyStoreState {
  data: string[]
  loading: boolean
}

type MyStoreGetters = BaseStore.Getters<
  MyStoreState,
  {
    filteredData: (state: MyStoreState) => string[]
  }
>

type MyStoreActions = BaseStore.Actions<
  MyStoreState,
  {
    fetchData: () => Promise<void>
  }
>
```

### 3. 命名空间约定

所有 Store 类型都使用命名空间，避免类型污染：

- `AnalyseStore.*` - 分析相关类型
- `ChartConfigStore.*` - 图表配置类型
- `FilterStore.*` - 过滤器类型
- `ColumnStore.*` - 数据列类型
- `UserStore.*` - 用户相关类型

## 🔄 维护指南

### 添加新的 Store 类型

1. **创建新的类型文件**: `types/store/NewModule.d.ts`

2. **遵循命名规范**:

   ```typescript
   declare namespace NewModuleStore {
     type NewModuleKey = 'newModule'

     type NewModuleState = {
       // 状态定义
     }

     type NewModuleGetters = BaseStore.Getters<
       NewModuleState,
       {
         // 自定义 getters
       }
     >

     type NewModuleActions = BaseStore.Actions<
       NewModuleState,
       {
         // 自定义 actions
       }
     >
   }
   ```

3. **更新本文档**: 在文件结构表格中添加新模块的说明

### 修改现有类型

1. **保持向后兼容**: 尽量通过扩展而非修改现有类型
2. **更新相关模块**: 如果类型被其他模块引用，需同步更新
3. **添加注释**: 为新增的类型属性添加详细的 JSDoc 注释

## 🎯 最佳实践

1. **类型安全**: 充分利用 TypeScript 的类型检查，避免运行时错误
2. **命名一致**: 遵循既定的命名规范，保持代码风格统一
3. **文档同步**: 修改类型时及时更新相关文档和注释
4. **模块化**: 保持各 Store 模块的独立性，减少不必要的依赖
5. **复用性**: 利用基础类型和泛型提高代码复用性

## 📊 依赖关系

```
BaseStore (基础类型)
    ↓
├── AnalyseStore
├── ChartConfigStore
├── FilterStore
├── ColumnStore
├── UserStore
└── ...其他 Store

Common (公共类型)
    ↓
└── 跨模块共享类型 (如 DragData)
```

当对应的 Store 实现发生变更时，请及时更新相应的类型声明文件，确保类型安全和开发体验。
