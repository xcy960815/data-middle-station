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
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('vue')) return 'vue'
              if (id.includes('element-plus'))
                return 'element-plus'
              if (id.includes('pinia')) return 'pinia'
              if (id.includes('echarts')) return 'echarts'
              if (id.includes('icon-park'))
                return 'icon-park'
              if (id.includes('xlsx')) return 'xlsx'
              return 'vendor'
            }
          }
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
    // 服务数据库配置
    serviceDbHost: process.env.SERVICE_DB_HOST,
    serviceDbPort: String(process.env.SERVICE_DB_PORT),
    serviceDbUser: process.env.SERVICE_DB_USER,
    serviceDbPwd: process.env.SERVICE_DB_PASSWORD,
    serviceDbName: process.env.SERVICE_DB_NAME,
    serviceDbTimezone: process.env.SERVICE_DB_TIMEZONE,
    serviceDbStrings: String(
      process.env.SERVICE_DB_DATE_STRINGS
    ),
    /**
     * 所需数据分析数据库名称
     */
    serviceDataDbName: process.env.SERVICE_DATA_DB_NAME,
    /**
     * 所需数据分析数据库主机
     */
    serviceDataDbHost: process.env.SERVICE_DATA_DB_HOST,
    /**
     * 所需数据分析数据库端口
     */
    serviceDataDbPort: String(
      process.env.SERVICE_DATA_DB_PORT
    ),
    /**
     * 所需数据分析数据库用户
     */
    serviceDataDbUser: process.env.SERVICE_DATA_DB_USER,
    /**
     * 所需数据分析数据库密码
     */
    serviceDataDbPwd: process.env.SERVICE_DATA_DB_PASSWORD,
    /**
     * 所需数据分析数据库时区
     */
    serviceDataDbTimezone:
      process.env.SERVICE_DATA_DB_TIMEZONE,
    /**
     * 所需数据分析数据库字符串
     */
    serviceDataDbStrings: String(
      process.env.SERVICE_DATA_DB_DATE_STRINGS
    ),
    /**
     * 服务redis配置
     */
    serviceRedisBase: process.env.SERVICE_REDIS_BASE,
    /**
     * 服务redis主机
     */
    serviceRedisHost: process.env.SERVICE_REDIS_HOST,
    /**
     * 服务redis端口
     */
    serviceRedisPort: String(
      process.env.SERVICE_REDIS_PORT || ''
    ),
    /**
     * 服务redis用户
     */
    serviceRedisUsername:
      process.env.SERVICE_REDIS_USERNAME,
    /**
     * 服务redis密码
     */
    serviceRedisPassword:
      process.env.SERVICE_REDIS_PASSWORD,
    /**
     * 服务redis数据库
     */
    serviceRedisDb: String(
      process.env.SERVICE_REDIS_DB || ''
    ),

    // 公共键（在客户端和服务器端都可用）
    public: {
      apiBase: '/api',
      appName: process.env.APP_NAME
    }
  }
})
