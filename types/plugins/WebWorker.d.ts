/**
 * Web Worker 类型定义
 */
declare namespace Webworker {
  /**
   * @desc Web Worker 插件实例
   */
  export interface Instance {
    readonly stats: Readonly<WorkerStats>
    readonly actionCount: number
    createWorkerScript<T>(callback: () => T): string
    run<R>(callback: () => R, options?: WorkerOptions): Promise<WorkerResult<R>>
    postMessage<R>(messageName: string, options?: WorkerOptions): Promise<WorkerResult<R>>
    postMessageAll<T = any>(params?: PostAllParams): Promise<WorkerResult<T>[]>
    addActions(actions: Action | Action[]): number
    removeActions(messageNames: string | string[]): number
    clearActions(): void
    getActionNames(): string[]
    hasAction(messageName: string): boolean
    getAction(messageName: string): Action | undefined
    batchExecute<T>(callbacks: Array<() => T>, options?: WorkerOptions): Promise<WorkerResult<T>[]>
    resetStats(): void
  }

  /**
   * @desc 动作
   */
  export interface Action<T = any, R = any> {
    message: string
    callback?: () => R
    metadata?: T
  }

  /**
   * @desc 工作者
   */
  export interface Worker extends globalThis.Worker {
    post<T = any>(): Promise<T>
  }

  /**
   * @desc 发布所有参数
   */
  export interface PostAllParams {
    messages?: string[]
    actions?: Action[]
    filter?: ((action: Action) => boolean) | null | undefined
  }

  /**
   * @desc 工作者选项
   */
  export interface WorkerOptions {
    timeout?: number
    retryCount?: number
    retryDelay?: number
  }

  /**
   * @desc 工作者结果
   */
  export interface WorkerResult<T = any> {
    data: T
    success: boolean
    error?: Error
    executionTime: number
  }

  /**
   * @desc 工作者统计
   */
  export interface WorkerStats {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    lastExecutionTime: number
  }
}
