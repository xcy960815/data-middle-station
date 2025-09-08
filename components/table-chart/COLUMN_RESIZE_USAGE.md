# 表格列宽拖拽调整功能使用说明

## 功能概述

表格组件现在支持通过拖拽调整列宽，并提供列宽持久化保存功能。

## 核心特性

1. **拖拽调整列宽**: 鼠标悬停在列边界时显示调整手柄，可拖拽调整列宽
2. **邻近列调整**: 调整一列宽度时，右侧邻近列会自动调整以保持总宽度平衡
3. **最小宽度约束**: 列宽不能小于 `minAutoColWidth` 配置项
4. **持久化保存**: 通过事件回调保存列宽配置
5. **初始化恢复**: 支持从外部设置保存的列宽配置

## 使用方法

### 基础使用

```vue
<template>
  <CanvasTable :data="tableData" :x-axis-fields="columns" @column-width-change="handleColumnWidthChange" />
</template>

<script setup>
const handleColumnWidthChange = ({ columnName, width, columnWidthOverrides }) => {
  console.log(`列 ${columnName} 宽度调整为: ${width}px`)
  console.log('所有列宽覆盖:', columnWidthOverrides)

  // 保存到 localStorage 或服务器
  localStorage.setItem('tableColumnWidths', JSON.stringify(columnWidthOverrides))
}
</script>
```

### 恢复保存的列宽

```vue
<script setup>
import { onMounted, ref } from 'vue'

const tableRef = ref()

onMounted(() => {
  // 从 localStorage 或服务器加载保存的列宽
  const savedWidths = localStorage.getItem('tableColumnWidths')
  if (savedWidths) {
    const columnWidthOverrides = JSON.parse(savedWidths)

    // 通过 konvaStageHandler 恢复列宽
    const { setColumnWidthOverrides } = konvaStageHandler({ props, emits })
    setColumnWidthOverrides(columnWidthOverrides)
  }
})
</script>
```

## 事件说明

### column-width-change

当用户完成列宽拖拽调整时触发。

**参数:**

```typescript
{
  columnName: string,           // 被调整的列名
  width: number,               // 调整后的宽度
  columnWidthOverrides: Record<string, number>  // 所有列宽覆盖配置
}
```

## API 方法

### setColumnWidthOverrides(overrides)

设置列宽覆盖配置，用于恢复保存的列宽。

**参数:**

- `overrides`: `Record<string, number>` - 列宽覆盖配置对象

**示例:**

```javascript
const { setColumnWidthOverrides } = konvaStageHandler({ props, emits })
setColumnWidthOverrides({
  column1: 150,
  column2: 200,
  column3: 100
})
```

## 配置项

相关的 props 配置：

- `minAutoColWidth`: 列的最小宽度，默认值根据组件配置而定
- `scrollbarSize`: 滚动条尺寸，影响列宽计算

## 实现细节

1. **拖拽手柄**: 每列右边缘有一个 6px 宽的透明拖拽区域
2. **鼠标样式**: 悬停时显示 `col-resize` 光标
3. **实时更新**: 拖拽过程中实时更新表格显示
4. **约束处理**: 自动应用最小宽度约束
5. **事件冒泡**: 完整的拖拽事件处理，防止意外状态

## 注意事项

1. 列宽调整会影响整个表格的布局
2. 固定列（left/right）和可滚动列分别处理
3. 邻近列调整仅在有右侧邻近列时生效
4. 列宽持久化需要外部实现存储逻辑
