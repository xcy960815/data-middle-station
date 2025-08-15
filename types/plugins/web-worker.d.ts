/**
 * Web Worker 类型定义
 */
declare namespace Webworker {
  export interface Action<T = any, R = any> {
    message: string
    callback?: () => R
    metadata?: T
  }

  export interface Worker extends globalThis.Worker {
    post<T = any>(): Promise<T>
  }

  export interface PostAllParams {
    messages?: string[]
    actions?: Action[]
    filter?: ((action: Action) => boolean) | null | undefined
  }

  export interface WorkerOptions {
    timeout?: number
    retryCount?: number
    retryDelay?: number
  }

  export interface WorkerResult<T = any> {
    data: T
    success: boolean
    error?: Error
    executionTime: number
  }

  export interface WorkerStats {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    lastExecutionTime: number
  }
}
