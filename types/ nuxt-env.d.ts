// 重写 nuxt runtime config
import { NuxtRuntimeConfig as OriginalNuxtRuntimeConfig } from '@nuxt/types/config/runtime'
import mysql from 'mysql2/promise'

declare module '@nuxt/types/config/runtime' {
  interface NuxtRuntimeConfig
    extends OriginalNuxtRuntimeConfig {}
}

declare function useRuntimeConfig(): OriginalNuxtRuntimeConfig

import 'h3'

declare module 'h3' {
  interface H3EventContext {
    // 给服务端的 event.content 添加声明 默认情况下  event.content 只有params?: Record<string, string>; sessions?: Record<string, Session>;
    name: string
  }
}

declare module '@antv/g2/dist/g2.min.js'
