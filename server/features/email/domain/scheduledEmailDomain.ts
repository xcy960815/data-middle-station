/**
 * @desc 定时邮件 - 领域模型 / 状态机 / 时间计算
 *
 * 抽取此模块的动机：
 *  - 原 `ScheduledEmailService` 内同时混杂了 CRUD、执行、状态判定、时间计算
 *  - 状态字符串（'pending' / 'running' / 'failed' / ...）散布在 service / mapper / scheduler 多处
 *  - 每次新增一种状态迁移，都要扫描整个仓库 grep
 *
 * 本模块将"领域规则"集中到一处：
 *  - 状态/类型枚举常量
 *  - 各类状态判定函数（canEdit / canDelete / canToggleFromPending / ...）
 *  - 调度相关派生规则（shouldScheduleTask / claimAllowedStatuses）
 *  - 重复任务下次执行时间计算
 *
 * 设计原则：纯函数 + 常量 + 类型，不持有外部依赖（mapper / service / runtime config）
 */

import { calculateNextExecutionTime } from '../scheduler/schedulerUtils'

/* ============================== 任务状态 ============================== */

/**
 * @desc 任务状态枚举
 *  - pending:   待执行
 *  - running:   抢占执行中
 *  - completed: 执行完成（仅 scheduled 类型最终态）
 *  - failed:    执行失败
 *  - cancelled: 已取消
 */
export const TaskStatus = {
  Pending: 'pending',
  Running: 'running',
  Completed: 'completed',
  Failed: 'failed',
  Cancelled: 'cancelled'
} as const

export type TaskStatusValue = ScheduledEmailDao.Status

/**
 * @desc 任务类型枚举
 *  - scheduled: 一次性定时任务
 *  - recurring: 重复任务（按周天 + HH:mm 触发）
 */
export const TaskType = {
  Scheduled: 'scheduled',
  Recurring: 'recurring'
} as const

export type TaskTypeValue = ScheduledEmailDao.TaskType

/* ============================== 状态机 / 操作权限 ============================== */

/**
 * @desc 是否允许编辑该任务
 * 规则：仅 pending / failed 允许编辑
 */
export const canEditTask = (status: TaskStatusValue): boolean =>
  status === TaskStatus.Pending || status === TaskStatus.Failed

/**
 * @desc 是否允许删除该任务
 * 规则：running 状态禁止删除（防止抢占中被误删）
 */
export const canDeleteTask = (status: TaskStatusValue): boolean => status !== TaskStatus.Running

/**
 * @desc 是否允许立即执行该任务
 * 规则：仅 pending / failed 允许手动触发
 */
export const canExecuteTask = (status: TaskStatusValue): boolean =>
  status === TaskStatus.Pending || status === TaskStatus.Failed

/**
 * @desc 是否允许在 pending ↔ cancelled 之间切换
 * 规则：只有这两个状态可以互相切换
 */
export const canToggleTaskStatus = (status: TaskStatusValue): boolean =>
  status === TaskStatus.Pending || status === TaskStatus.Cancelled

/* ============================== 调度器接管规则 ============================== */

/**
 * @desc 该任务是否应该被内存调度器接管（注册到 node-schedule）
 * @description
 *  - 未激活的任务不接管
 *  - scheduled 单次任务：仅当状态为 pending 且有 scheduleTime 时接管
 *  - recurring 重复任务：只要不是 cancelled 都接管（pending / failed 都可下次周期再触发）
 */
export const shouldScheduleTask = (task: ScheduledEmailVo.ScheduledEmailTaskResponse): boolean => {
  if (!task.isActive) {
    return false
  }

  if (task.taskType === TaskType.Scheduled) {
    return task.status === TaskStatus.Pending && Boolean(task.scheduleTime)
  }

  return task.status !== TaskStatus.Cancelled
}

/**
 * @desc 抢占执行时，允许从哪些状态进入 running
 * @description
 *  - scheduled: 只允许 pending / failed → running（completed 是最终态，不可重抢）
 *  - recurring: 允许 pending / failed / completed → running（completed 仅在历史遗留数据中出现）
 */
export const getClaimAllowedStatuses = (taskType: TaskTypeValue): TaskStatusValue[] =>
  taskType === TaskType.Recurring
    ? [TaskStatus.Pending, TaskStatus.Failed, TaskStatus.Completed]
    : [TaskStatus.Pending, TaskStatus.Failed]

/* ============================== 时间计算 ============================== */

/**
 * @desc 计算任务下一次执行时间
 *  - scheduled: 直接返回原 scheduleTime（一次性任务）
 *  - recurring: 根据 recurringDays / recurringTime 计算下一次匹配的时间
 */
export const calculateTaskNextExecutionTime = (task: {
  taskType: TaskTypeValue
  scheduleTime?: string | null
  recurringDays?: number[] | null
  recurringTime?: string | null
}): string | null => {
  if (task.taskType === TaskType.Recurring) {
    if (!task.recurringDays || !task.recurringTime) {
      return null
    }
    return calculateNextExecutionTime(task.recurringDays, task.recurringTime)
  }

  return task.scheduleTime || null
}
