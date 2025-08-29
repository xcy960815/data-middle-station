/**
 * 增强的 Web Worker 实现类
 */
export class Webworker {
  private readonly _actions = new Map<string, Webworker.Action>()
  private readonly _workerPool = new Map<string, Worker>()
  private readonly _stats: Webworker.WorkerStats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    lastExecutionTime: 0
  }

  private readonly _defaultOptions: Required<Webworker.WorkerOptions> = {
    timeout: 30000,
    retryCount: 2,
    retryDelay: 1000
  }

  constructor(actions?: Webworker.Action[]) {
    if (actions) {
      this.addActions(actions)
    }
  }

  /**
   * 获取统计信息
   */
  get stats(): Readonly<Webworker.WorkerStats> {
    return { ...this._stats }
  }

  /**
   * 获取已注册的 action 数量
   */
  get actionCount(): number {
    return this._actions.size
  }

  /**
   * 检查 action 是否已存在
   */
  private _hasAction(messageName: string): boolean {
    return this._actions.has(messageName)
  }

  /**
   * 移除指定的 action
   */
  private _removeAction(messageName: string): boolean {
    return this._actions.delete(messageName)
  }

  /**
   * 创建可销毁的 Worker
   */
  private _createDisposableWorker(workerScript: string, options: Webworker.WorkerOptions = {}): Webworker.Worker {
    const mergedOptions = { ...this._defaultOptions, ...options }

    // 使用更安全的 URL 创建方式
    const URL = window.URL || (window as any).webkitURL
    const workerScriptBlob = new Blob([workerScript], {
      type: 'application/javascript'
    })

    const objectURL = URL.createObjectURL(workerScriptBlob)
    const worker = new Worker(objectURL) as Webworker.Worker

    // 增强的 post 方法，支持超时和重试
    worker.post = <T = any>(): Promise<T> => {
      return new Promise((resolve, reject) => {
        const startTime = performance.now()
        let timeoutId: NodeJS.Timeout
        let retryCount = 0

        const cleanup = () => {
          clearTimeout(timeoutId)
          URL.revokeObjectURL(objectURL)
          worker.terminate()
        }

        const executeWithRetry = () => {
          timeoutId = setTimeout(() => {
            if (retryCount < mergedOptions.retryCount) {
              retryCount++
              setTimeout(executeWithRetry, mergedOptions.retryDelay)
            } else {
              cleanup()
              const error = new Error(`Worker execution timeout after ${mergedOptions.timeout}ms`)
              reject(error)
            }
          }, mergedOptions.timeout)

          worker.onmessage = (event) => {
            const executionTime = performance.now() - startTime
            this._updateStats(true, executionTime)
            cleanup()
            resolve(event.data)
          }

          worker.onerror = (error: ErrorEvent) => {
            const executionTime = performance.now() - startTime
            this._updateStats(false, executionTime)
            cleanup()
            reject(new Error(`Worker error: ${error.message}`))
          }

          worker.postMessage({})
        }

        executeWithRetry()
      })
    }

    return worker
  }

  /**
   * 更新统计信息
   */
  private _updateStats(success: boolean, executionTime: number): void {
    this._stats.totalExecutions++
    this._stats.lastExecutionTime = executionTime

    if (success) {
      this._stats.successfulExecutions++
    } else {
      this._stats.failedExecutions++
    }

    // 计算平均执行时间
    const totalTime = this._stats.averageExecutionTime * (this._stats.totalExecutions - 1) + executionTime
    this._stats.averageExecutionTime = totalTime / this._stats.totalExecutions
  }

  /**
   * 创建 Worker 脚本
   */
  createWorkerScript<T>(callback: () => T): string {
    const callbackStr = callback.toString()
    return `
      self.onmessage = function(event) {
        try {
          const startTime = performance.now()
          const result = (${callbackStr})()
          const executionTime = performance.now() - startTime

          self.postMessage({
            data: result,
            success: true,
            executionTime: executionTime
          })
        } catch (error) {
          self.postMessage({
            data: null,
            success: false,
            error: error.message,
            executionTime: 0
          })
        } finally {
          self.close()
        }
      }
    `
  }

  /**
   * 执行 Worker 任务
   */
  public async run<R>(callback: () => R, options?: Webworker.WorkerOptions): Promise<Webworker.WorkerResult<R>> {
    try {
      const worker = this._createDisposableWorker(this.createWorkerScript<R>(callback), options)

      const result = await worker.post<Webworker.WorkerResult<R>>()
      return result
    } catch (error) {
      const errorResult: Webworker.WorkerResult<R> = {
        data: null as any,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: 0
      }

      this._updateStats(false, 0)
      return errorResult
    }
  }

  /**
   * 通过消息名称执行 Worker 任务
   */
  public async postMessage<R>(
    messageName: string,
    options?: Webworker.WorkerOptions
  ): Promise<Webworker.WorkerResult<R>> {
    const action = this._actions.get(messageName)

    if (!action) {
      const errorResult: Webworker.WorkerResult<R> = {
        data: null as any,
        success: false,
        error: new Error(`Action "${messageName}" is not registered`),
        executionTime: 0
      }
      return errorResult
    }

    if (!action.callback) {
      const errorResult: Webworker.WorkerResult<R> = {
        data: null as any,
        success: false,
        error: new Error(`Action "${messageName}" has no callback`),
        executionTime: 0
      }
      return errorResult
    }

    return this.run<R>(action.callback, options)
  }

  /**
   * 执行所有 Worker 任务
   */
  public async postMessageAll<T extends any = any>(
    params?: Webworker.PostAllParams
  ): Promise<Webworker.WorkerResult<T>[]> {
    let actionsToExecute: Webworker.Action[] = []

    if (params?.messages) {
      // 通过消息名称执行
      actionsToExecute = params.messages
        .map((message) => this._actions.get(message))
        .filter((action): action is Webworker.Action => action !== undefined)
    } else if (params?.actions) {
      // 直接执行提供的 actions
      actionsToExecute = params.actions
    } else {
      // 执行所有已注册的 actions
      actionsToExecute = Array.from(this._actions.values())
    }

    // 应用过滤器
    if (params?.filter) {
      actionsToExecute = actionsToExecute.filter(params.filter!)
    }

    if (actionsToExecute.length === 0) {
      return []
    }

    const results = await Promise.allSettled(
      actionsToExecute.filter((action) => action.callback).map((action) => this.run<T>(action.callback!))
    )

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          data: null as any,
          success: false,
          error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
          executionTime: 0
        }
      }
    })
  }

  /**
   * 添加单个或多个 actions
   */
  public addActions(actions: Webworker.Action | Webworker.Action[]): number {
    const actionArray = Array.isArray(actions) ? actions : [actions]

    actionArray.forEach((action) => {
      if (action.message && action.callback) {
        this._actions.set(action.message, action)
      }
    })

    return this._actions.size
  }

  /**
   * 移除单个或多个 actions
   */
  public removeActions(messageNames: string | string[]): number {
    const names = Array.isArray(messageNames) ? messageNames : [messageNames]

    names.forEach((name) => {
      this._removeAction(name)
    })

    return this._actions.size
  }

  /**
   * 清空所有 actions
   */
  public clearActions(): void {
    this._actions.clear()
  }

  /**
   * 获取所有已注册的 action 名称
   */
  public getActionNames(): string[] {
    return Array.from(this._actions.keys())
  }

  /**
   * 检查 action 是否存在
   */
  public hasAction(messageName: string): boolean {
    return this._hasAction(messageName)
  }

  /**
   * 获取 action 信息
   */
  public getAction(messageName: string): Webworker.Action | undefined {
    return this._actions.get(messageName)
  }

  /**
   * 批量执行并收集结果
   */
  public async batchExecute<T>(
    callbacks: (() => T)[],
    options?: Webworker.WorkerOptions
  ): Promise<Webworker.WorkerResult<T>[]> {
    const results = await Promise.allSettled(callbacks.map((callback) => this.run<T>(callback, options)))

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          data: null as any,
          success: false,
          error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
          executionTime: 0
        }
      }
    })
  }

  /**
   * 重置统计信息
   */
  public resetStats(): void {
    Object.assign(this._stats, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0
    })
  }
}

/**
 * Nuxt 插件定义
 */
export default defineNuxtPlugin(() => {
  const webworker = new Webworker()

  return {
    provide: {
      webworker,
      // 提供便捷的全局方法
      runWorker: <T>(callback: () => T, options?: Webworker.WorkerOptions) => webworker.run<T>(callback, options),
      createWorker: (actions: Webworker.Action[]) => new Webworker(actions)
    }
  }
})
