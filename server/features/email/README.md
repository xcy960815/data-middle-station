# Email Feature

邮件相关业务模块（即时发送 + 定时任务 + 调度 + 日志 + 图表快照）。

## 目录结构

```
server/features/email/
├── domain/                              领域模型（纯数据 + 纯函数，无副作用）
│   ├── scheduledEmailDomain.ts          状态机常量 / 状态判定 / 时间计算
│   └── mailerProfile.ts                 发件人画像（runtimeConfig → 只读视图）
│
├── service/                             业务服务（含副作用，class 形式）
│   ├── sendEmailService.ts              SMTP 发件 + 模板 + 校验 schema
│   ├── scheduledEmailService.ts         定时任务 Facade（CRUD + 状态切换 + 委派 Executor）
│   ├── scheduledEmailExecutorService.ts 任务执行 / 重试 / 僵尸回收
│   ├── scheduledEmailLogService.ts      执行日志记录与查询
│   └── chartSnapshotService.ts          ECharts 服务端 SVG 渲染（邮件附件用）
│
├── scheduler/                           内存调度（node-schedule 包装）
│   ├── scheduledEmailScheduler.ts       注册 / 移除 / 同步 cron job
│   └── schedulerUtils.ts                重复任务下次执行时间计算工具
│
└── mapper/                              数据访问层
    ├── scheduledEmailMapper.ts          scheduled_email_tasks
    └── scheduledEmailLogMapper.ts       scheduled_email_logs
```

## 入口（Nitro 路由约定，不可移走）

| 路径                                      | 作用                                 |
| ----------------------------------------- | ------------------------------------ |
| `server/api/sendEmail.post.ts`            | 即时发送邮件（含自动渲染图表附件）   |
| `server/api/scheduledEmails.post.ts`      | 创建定时任务                         |
| `server/api/getScheduledEmailTaskList.ts` | 任务列表                             |
| `server/api/testExecuteTask.post.ts`      | 手动触发执行（测试用）               |
| `server/plugins/send-emails-regularly.ts` | 启动调度系统 + 周期回收 + close 清理 |

这些是 Nitro 文件路由约定目录，**不能搬走**，它们都是薄壳，业务逻辑全部在 `service/`。

## 状态机

任务（`scheduled_email_tasks.status`）状态枚举：

```
pending → running → completed   （scheduled 一次性任务最终态）
pending → running → pending     （recurring 重复任务每周期循环）
pending → running → failed → pending（重试通过）
pending → running → failed → ... → 超过 maxRetries → recurring 转 pending（下周期）/ scheduled 终态 failed
pending ↔ cancelled              （toggle 启停）
running →（超时被 recover）→ failed/pending
```

详细判定函数集中在 `domain/scheduledEmailDomain.ts`。

## 自愈机制

进程崩溃 / OOM / 容器重启会让任务卡死在 `running`。`scheduledEmailExecutorService.recoverStaleRunningTasks` + 插件中的周期 job 会自动回收：

- 阈值：`SCHEDULED_EMAIL_RUNNING_TIMEOUT_MINUTES`（默认 10 分钟）
- 周期：`SCHEDULED_EMAIL_RECOVERY_INTERVAL_MINUTES`（默认 5 分钟）
- 启动时也会执行一次

## 依赖方向（单向，无环）

```
api / plugin
    ↓
service/scheduledEmailService (Facade)
    ↓
service/scheduledEmailExecutorService → service/sendEmailService → service/chartSnapshotService → (analyzeService, chartDataService 跨 feature)
    ↓                                       ↓
service/scheduledEmailLogService         domain/mailerProfile (Send 与 Log 共享)
    ↓                                       ↑
mapper/*                                    └────── domain (纯函数，零依赖)
                                                        ↑
                                                  scheduler/schedulerUtils
```

注意：

- `LogService` **不依赖** `SendEmailService`（通过 `mailerProfile` 解耦）
- `domain` 是纯函数模块，可被任意层引用
- `chartSnapshotService` 是 email 与 analyze 模块的边界点：依赖 analyze 数据层
