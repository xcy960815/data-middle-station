// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'path'
export default defineNuxtConfig({
  experimental: {
    renderJsonPayloads: false
  },
  app: {
    head: {
      title: process.env.APP_NAME,
      link: [
        // 要放在public中
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/data-middle-station.ico'
        }
        // { rel: 'icon', type: 'image/png', href: '/logos/favicon-32x32.png' },
      ]
    }
  },
  css: [
    // 加载全局 css
    '~/assets/styles/main.css',
    // 加载全局 scss
    '~/assets/styles/theme-util.scss'
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  imports: {
    // 自动加载 引入自定义模块
    dirs: ['utils', 'stores']
  },
  alias: {
    '@': resolve(__dirname, '.')
  },
  // 引入 pinia
  modules: ['@pinia/nuxt'],
  components: [
    {
      path: '~/components',
      // 只把 `~/components/` 目录下的 `.vue` 文件列为组件
      extensions: ['.vue']
    }
  ],
  pinia: {
    disableVuex: true
  },
  vite: {
    // publicPath: ''
    css: {
      preprocessorOptions: {
        scss: {
          // 引入全局scss 变量
          additionalData: `@use "./assets/styles/theme-variables.scss" as *;`
        }
      }
    },
    server: {
      hmr: {
        overlay: false
      }
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'THIS_IS_UNDEFINED') {
            // 忽略这个警告
            return
          }
          warn(warning)
        }
      }
    }
  },
  nitro: {
    compatibilityDate: '2024-05-27',
    esbuild: {
      options: {
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true
          }
        }
      }
    },
    moduleSideEffects: ['node-cron']
  },
  runtimeConfig: {
    // 私有键（仅在服务器端可用）
    configDbHost: process.env.CONFIG_DB_HOST,
    configDbPort: process.env.CONFIG_DB_PORT,
    configDbUser: process.env.CONFIG_DB_USER,
    configDbPassword: process.env.CONFIG_DB_PASSWORD,
    configDbName: process.env.CONFIG_DB_NAME,
    configDbTimezone: process.env.CONFIG_DB_TIMEZONE,
    configDbDateStrings: process.env.CONFIG_DB_DATE_STRINGS,
    kanbanDbName: process.env.KANBAN_DB_NAME,
    kanbanDbHost: process.env.KANBAN_DB_HOST,
    kanbanDbPort: process.env.KANBAN_DB_PORT,
    kanbanDbUser: process.env.KANBAN_DB_USER,
    kanbanDbPassword: process.env.KANBAN_DB_PASSWORD,
    kanbanDbTimezone: process.env.KANBAN_DB_TIMEZONE,
    kanbanDbDateStrings: process.env.KANBAN_DB_DATE_STRINGS,
    // 公共键（在客户端和服务器端都可用）
    public: {
      apiBase: '/api'
    }
  }
})
