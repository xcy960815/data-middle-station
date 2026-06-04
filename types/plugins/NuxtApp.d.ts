declare module '#app' {
  type IndexDBManagerInstance = import('~/plugins/indexdb.client').IndexDBManagerInstance

  /**
   * @desc Nuxt应用
   */
  interface NuxtApp {
    $indexDB: IndexDBManagerInstance
    $webworker: Webworker.Instance
    $runWorker: <T>(callback: () => T, options?: Webworker.WorkerOptions) => Promise<Webworker.WorkerResult<T>>
    $createWorker: (actions: Webworker.Action[]) => Webworker.Instance
  }
}

declare module 'vue' {
  type IndexDBManagerInstance = import('~/plugins/indexdb.client').IndexDBManagerInstance

  /**
   * @desc 组件自定义属性
   */
  interface ComponentCustomProperties {
    $indexDB: IndexDBManagerInstance
    $webworker: Webworker.Instance
    $runWorker: <T>(callback: () => T, options?: Webworker.WorkerOptions) => Promise<Webworker.WorkerResult<T>>
    $createWorker: (actions: Webworker.Action[]) => Webworker.Instance
  }
}

export {}
