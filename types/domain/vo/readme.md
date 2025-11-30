# VO (View Object) Definitions

本目录包含视图对象（VO）的 TypeScript 类型定义。
VO 用于定义返回给客户端（前端）的数据结构。它们通常是经过处理、格式化或脱敏的数据，专门用于页面展示。

## 文件说明

| 文件名                     | 描述            | 主要用途                                       |
| :------------------------- | :-------------- | :--------------------------------------------- |
| `AnalyzeConfigVo.d.ts`     | 分析配置 VO     | 返回给前端的图表、报表配置信息                 |
| `AnalyzeDataVo.d.ts`       | 分析数据 VO     | 返回给前端的具体分析数据结果                   |
| `AnalyzeVo.d.ts`           | 分析 VO         | 通用的分析相关展示对象                         |
| `DataBaseVo.d.ts`          | 数据库 VO       | 数据库信息展示对象（如连接状态、列表等）       |
| `LoginVo.d.ts`             | 登录 VO         | 登录成功后的响应数据（如 Token、用户信息摘要） |
| `ScheduledEmailLogVo.d.ts` | 定时邮件日志 VO | 定时邮件执行记录的展示对象                     |
| `ScheduledEmailVo.d.ts`    | 定时邮件 VO     | 定时邮件任务详情的展示对象                     |
| `SendEmailVo.d.ts`         | 发送邮件 VO     | 邮件发送操作的结果反馈                         |
| `UserInfoVo.d.ts`          | 用户信息 VO     | 用户个人资料、权限等展示信息                   |

## 使用规范

1. **命名规范**: 文件名以 `Vo.d.ts` 结尾，类型定义通常放在 `declare namespace [Name]Vo` 下。
2. **用途**: 用于 API 响应数据，直接对接前端视图组件。
3. **安全性**: 注意不要在 VO 中包含敏感数据（如密码、密钥等），除非经过加密或脱敏处理。
