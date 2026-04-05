declare module '#app' {
  /**
   * @desc Nuxt应用
   */
  interface NuxtApp {
    $webworker: Webworker.Instance
    $runWorker: <T>(callback: () => T, options?: Webworker.WorkerOptions) => Promise<Webworker.WorkerResult<T>>
    $createWorker: (actions: Webworker.Action[]) => Webworker.Instance
  }
}

declare module 'vue' {
  /**
   * @desc 组件自定义属性
   */
  interface ComponentCustomProperties {
    $webworker: Webworker.Instance
    $runWorker: <T>(callback: () => T, options?: Webworker.WorkerOptions) => Promise<Webworker.WorkerResult<T>>
    $createWorker: (actions: Webworker.Action[]) => Webworker.Instance
  }
}

export {}
