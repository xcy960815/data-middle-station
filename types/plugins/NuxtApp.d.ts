import type { Webworker } from '~/plugins/webworker.client'

declare module '#app' {
  /**
   * @desc Nuxt应用
   */
  interface NuxtApp {
    $webworker: Webworker
    $runWorker: <T>(callback: () => T, options?: Webworker.WorkerOptions) => Promise<Webworker.WorkerResult<T>>
    $createWorker: (actions: Webworker.Action[]) => Webworker
  }
}

declare module 'vue' {
  /**
   * @desc 组件自定义属性
   */
  interface ComponentCustomProperties {
    $webworker: Webworker
    $runWorker: <T>(callback: () => T, options?: Webworker.WorkerOptions) => Promise<Webworker.WorkerResult<T>>
    $createWorker: (actions: Webworker.Action[]) => Webworker
  }
}

export {}
