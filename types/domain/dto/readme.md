# DTO (Data Transfer Object) 类型定义

本目录包含所有数据传输对象的 TypeScript 类型定义。DTO 用于在不同层之间传输数据，确保数据结构的一致性和类型安全。

## 文件说明

### AnalyseDto.d.ts

分析相关的数据传输对象类型定义

- 分析配置传输对象
- 分析结果传输对象
- 分析查询参数对象

### ChartConfigDto.d.ts

图表配置相关的数据传输对象类型定义

- 图表配置传输对象
- 图表样式配置对象
- 图表交互配置对象

### ChartDataDto.d.ts

图表数据相关的数据传输对象类型定义

- 图表数据传输对象
- 数据查询参数对象
- 数据处理配置对象

### LoginDto.d.ts

登录相关的数据传输对象类型定义

- 登录请求对象
- 登录响应对象
- 用户认证信息对象

### SendEmailDto.d.ts

邮件发送相关的数据传输对象类型定义

- 邮件发送请求对象
- 图表邮件导出配置对象
- 邮件附件配置对象

## 命名规范

- 所有 DTO 类型都应该以 `Dto` 为后缀
- 使用 PascalCase 命名方式
- 接口名应该清晰地描述其用途
- 嵌套命名空间使用相同的基础名称

## 使用示例

```typescript
// 导入 DTO 类型
import type { AnalyseDto } from '~/types/domain/dto/AnalyseDto'

// 使用 DTO 类型
const analyseRequest: AnalyseDto.CreateAnalyseRequest = {
  name: '示例分析',
  config: {
    /* 配置对象 */
  }
}
```

## 注意事项

1. DTO 类型仅用于数据传输，不包含业务逻辑
2. 所有 DTO 类型都应该是只读的或包含适当的验证
3. 保持 DTO 类型的简洁性，避免过度复杂的嵌套结构
4. 及时更新类型定义以反映 API 变更
