import type { Webworker } from '~/plugins/webworker.client'

declare module '#app' {
  interface NuxtApp {
    $webworker: Webworker
    $runWorker: <T>(callback: () => T, options?: Webworker.WorkerOptions) => Promise<Webworker.WorkerResult<T>>
    $createWorker: (actions: Webworker.Action[]) => Webworker
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $webworker: Webworker
    $runWorker: <T>(callback: () => T, options?: Webworker.WorkerOptions) => Promise<Webworker.WorkerResult<T>>
    $createWorker: (actions: Webworker.Action[]) => Webworker
  }
}

export {}
