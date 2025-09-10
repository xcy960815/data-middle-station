# VO (Value Object) 类型定义

本目录包含所有值对象的 TypeScript 类型定义。VO 用于表示业务领域中的值对象，通常是不可变的数据结构，用于封装相关的数据和行为。

## 文件说明

### ChartDataVo.d.ts

图表数据相关的值对象类型定义

- 图表数据值对象
- 图表数据项对象
- 图表数据处理结果对象

## VO vs DTO 区别

| 特征     | VO (Value Object)      | DTO (Data Transfer Object) |
| -------- | ---------------------- | -------------------------- |
| 用途     | 表示业务领域中的值概念 | 用于数据传输               |
| 可变性   | 通常不可变             | 可变                       |
| 业务逻辑 | 可包含业务逻辑         | 不包含业务逻辑             |
| 生命周期 | 贯穿整个业务流程       | 仅在数据传输时使用         |
| 验证     | 包含数据验证逻辑       | 简单的数据结构             |

## 命名规范

- 所有 VO 类型都应该以 `Vo` 为后缀
- 使用 PascalCase 命名方式
- 接口名应该清晰地描述其业务含义
- 嵌套命名空间使用相同的基础名称

## 使用示例

```typescript
// 导入 VO 类型
import type { ChartDataVo } from '~/types/domain/vo/ChartDataVo'

// 使用 VO 类型
const chartData: ChartDataVo.ChartData = {
  id: '1',
  name: '销售数据',
  value: 1000,
  category: '产品A'
}

// VO 通常包含业务验证逻辑
const validateChartData = (data: ChartDataVo.ChartData): boolean => {
  return data.value > 0 && data.name.length > 0
}
```

## 设计原则

1. **不可变性**: VO 对象创建后不应该被修改
2. **值相等性**: 两个 VO 对象如果所有属性都相等，则认为它们相等
3. **自包含**: VO 应该包含完整的数据和相关的验证逻辑
4. **业务语义**: VO 应该反映业务领域中的真实概念

## 注意事项

1. VO 对象应该是不可变的，避免意外修改
2. 优先使用 `readonly` 修饰符来确保不可变性
3. VO 可以包含计算属性和验证方法
4. 保持 VO 的业务语义清晰，避免技术细节泄露
5. 合理使用组合，避免过度深层嵌套
