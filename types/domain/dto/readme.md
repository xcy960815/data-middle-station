# DTO (Data Transfer Object) Definitions

本目录包含数据传输对象（DTO）的 TypeScript 类型定义。
DTO 用于定义客户端与服务器之间，或不同服务层之间传输的数据结构。它们通常对应于 API 请求的 Payload 或服务方法的输入参数。

## 文件说明

| 文件名                      | 描述             | 主要用途                                       |
| :-------------------------- | :--------------- | :--------------------------------------------- |
| `AnalyzeConfigDto.d.ts`     | 分析配置 DTO     | 定义图表、报表分析的配置参数结构               |
| `AnalyzeDataDto.d.ts`       | 分析数据 DTO     | 定义用于分析的数据输入结构                     |
| `AnalyzeDto.d.ts`           | 分析 DTO         | 通用的分析相关数据传输对象                     |
| `DataBaseDto.d.ts`          | 数据库 DTO       | 数据库连接、查询相关的传输对象                 |
| `LoginDto.d.ts`             | 登录 DTO         | 用户登录请求的数据结构（如用户名、密码）       |
| `ScheduleTaskDto.d.ts`      | 定时任务 DTO     | 定时任务创建、更新相关的传输对象               |
| `ScheduledEmailDto.d.ts`    | 定时邮件 DTO     | 定时邮件任务的配置和请求结构                   |
| `ScheduledEmailLogDto.d.ts` | 定时邮件日志 DTO | 定时邮件执行日志的查询或传输结构               |
| `SendEmailDto.d.ts`         | 发送邮件 DTO     | 邮件发送请求的数据结构（收件人、主题、内容等） |

## 使用规范

1. **命名规范**: 文件名以 `Dto.d.ts` 结尾，类型定义通常放在 `declare namespace [Name]Dto` 下。
2. **用途**: 仅用于数据传输，不应包含业务逻辑。
3. **对应关系**: 通常与 Controller 层的接收参数或 Service 层的输入参数相对应。
