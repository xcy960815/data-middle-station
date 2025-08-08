# Canvas 表格组件

这是一个使用 HTML5 Canvas 实现的表格组件，具有与原生 HTML 表格相同的功能和样式。

## 特性

### 🎨 视觉效果
- **高DPI支持**: 自动适配高分辨率显示器，确保清晰度
- **现代化样式**: 与 Element Plus 设计风格保持一致
- **响应式布局**: 自动适应容器大小变化
- **平滑动画**: 支持鼠标悬停效果和过渡动画

### 📊 数据功能
- **分页显示**: 支持大数据量的分页展示
- **列排序**: 点击表头可进行升序/降序排序
- **条件格式**: 支持单色和色阶条件格式
- **智能列宽**: 支持内容自适应和平均分剩余宽度两种模式
- **文本截断**: 长文本自动截断并显示省略号

### 🎯 交互体验
- **表头点击**: 支持点击表头进行排序
- **鼠标悬停**: 表头悬停时显示指针样式
- **键盘导航**: 支持分页输入框的键盘操作
- **事件处理**: 完整的事件监听和清理机制

## 使用方法

### 列宽模式

组件支持两种列宽计算模式：

1. **平均分剩余宽度模式** (`enableEqualWidth: true`)
   - 所有列宽度相等
   - 平均分配可用宽度
   - 适合需要整齐布局的场景

2. **内容自适应模式** (`enableEqualWidth: false`)
   - 根据内容自动计算列宽
   - 优先满足内容显示需求
   - 剩余宽度平均分配给所有列

### 固定列功能

组件支持固定列功能，可以在水平滚动时保持某些列的位置：

```typescript
// 固定列配置
const fixedColumns = {
  left: 1,   // 左侧固定1列
  right: 1   // 右侧固定1列
}
```

**特性：**
- 支持左侧和右侧固定列
- 固定列会显示阴影效果，提示用户有更多内容可滚动
- 固定列数量可以动态调整
- 与列宽控制功能兼容

### 基本用法

```vue
<template>
  <CanvasTable 
    :data="tableData"
    :xAxisFields="xAxisFields"
    :yAxisFields="yAxisFields"
    :chartHeight="400"
    :chartWidth="800"
    :enableEqualWidth="true"
    :fixedColumns="{ left: 1, right: 1 }"
    :chartConfig="{
      conditions: [
        {
          conditionType: '单色',
          conditionField: 'salary',
          conditionSymbol: 'gt',
          conditionValue: 10000,
          conditionColor: '#67c23a'
        }
      ]
    }"
  />
</template>
```

<script setup>
import CanvasTable from '~/components/table-chart/index.vue'

const tableData = ref([
  { name: '张三', age: 25, salary: 8000, department: '技术部' },
  { name: '李四', age: 30, salary: 12000, department: '产品部' }
])

const xAxisFields = ref([
  { columnName: 'name', displayName: '姓名', columnType: 'varchar' },
  { columnName: 'age', displayName: '年龄', columnType: 'int' }
])

const yAxisFields = ref([
  { columnName: 'salary', displayName: '薪资', columnType: 'decimal' },
  { columnName: 'department', displayName: '部门', columnType: 'varchar' }
])
</script>
```

### Props 说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| data | `ChartDataDao.ChartData[]` | `[]` | 表格数据 |
| xAxisFields | `GroupStore.GroupOption[]` | `[]` | X轴字段配置 |
| yAxisFields | `DimensionStore.DimensionOption[]` | `[]` | Y轴字段配置 |
| chartHeight | `number` | `0` | 表格高度 |
| chartWidth | `number` | `0` | 表格宽度 |
| enableEqualWidth | `boolean` | `true` | 是否启用列平均分剩余宽度 |
| fixedColumns | `{left?: number, right?: number}` | `{}` | 固定列配置 |
| chartConfig | `{conditions?: Array<Condition>}` | `{}` | 图表配置（包含条件格式） |

### 字段配置

```typescript
interface GroupOption {
  columnName: string        // 字段名
  displayName?: string      // 显示名称
  columnType: string        // 字段类型
  columnCommon?: string     // 字段描述
  alias?: string           // 字段别名
  orderType?: 'asc' | 'desc' | null  // 排序类型
}

interface DimensionOption {
  columnName: string        // 字段名
  displayName?: string      // 显示名称
  columnType: string        // 字段类型
  columnCommon?: string     // 字段描述
  alias?: string           // 字段别名
}
```

## 样式配置

组件内置了完整的样式配置，包括：

```typescript
const tableStyles = {
  headerBg: '#f5f7fa',        // 表头背景色
  headerBorder: '#e4e7ed',    // 表头边框色
  headerText: '#606266',      // 表头文字色
  rowBg: '#ffffff',          // 行背景色
  rowBgEven: '#fafafa',      // 偶数行背景色
  rowHoverBg: '#f5f7fa',     // 行悬停背景色
  border: '#ebeef5',         // 边框色
  text: '#606266',           // 文字色
  fontSize: 13,              // 字体大小
  padding: 12                // 内边距
}
```

## 条件格式

支持两种条件格式类型：

### 单色条件格式
```typescript
{
  conditionType: '单色',
  conditionField: 'salary',
  conditionSymbol: 'gt',  // gt, lt, eq, ne, ge, le, between
  conditionValue: 10000,
  conditionColor: '#ff4949'
}
```

### 色阶条件格式
```typescript
{
  conditionType: '色阶',
  conditionField: 'performance',
  conditionColor: 'rgb(255, 73, 73)'
}
```

## 性能优化

### Canvas 渲染优化
- **批量绘制**: 一次性绘制所有元素，减少重绘次数
- **高DPI适配**: 自动处理设备像素比，确保清晰度
- **内存管理**: 及时清理事件监听器，避免内存泄漏

### 数据处理优化
- **分页加载**: 只渲染当前页的数据
- **列宽缓存**: 缓存列宽计算结果
- **条件格式缓存**: 缓存条件格式计算结果

## 与 HTML 表格对比

| 特性 | Canvas 表格 | HTML 表格 |
|------|-------------|-----------|
| 渲染性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 内存占用 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 样式定制 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 交互功能 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 兼容性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 开发复杂度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 注意事项

1. **Canvas 尺寸**: 组件会自动处理 Canvas 尺寸，但需要确保容器有明确的尺寸
2. **事件处理**: 组件会自动添加和清理事件监听器
3. **数据更新**: 数据变化时会自动重新渲染表格
4. **样式覆盖**: 可以通过 CSS 变量覆盖默认样式

## 示例

查看 `pages/table-demo/index.vue` 获取完整的使用示例。

## 更新日志

### v1.2.0
- 新增chartConfig属性支持
- 支持通过props传入条件格式配置
- 优化条件格式处理逻辑

### v1.1.0
- 新增固定列功能
- 支持左侧和右侧固定列
- 添加固定列阴影效果
- 优化滚动体验

### v1.0.0
- 初始版本发布
- 支持基本的表格渲染和交互
- 支持分页和排序功能
- 支持条件格式
