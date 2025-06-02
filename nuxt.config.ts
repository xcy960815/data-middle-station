// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'path'
export default defineNuxtConfig({
  app: {
    head: {
      title: process.env.APP_NAME,
      link: [
        // 要放在public中
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/logos/favicon.ico'
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
    // TODO
    // 私有键（仅在服务器端可用）
    // dbHost: process.env.DB_HOST,
    // // dbPort: process.env.DB_PORT,
    // dbUser: process.env.DB_USER,
    // dbPassword: process.env.DB_PASSWORD,
    // dbName: process.env.DB_NAME,
    // redisHost: process.env.REDIS_HOST,
    // // redisPort: process.env.REDIS_PORT,
    // redisPassword: process.env.REDIS_PASSWORD,
    // // redisDb: process.env.REDIS_DB,
    // jwtSecret: process.env.JWT_SECRET,
    // jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    // // 公共键（在客户端和服务器端都可用）
    // public: {
    //   apiBaseUrl: process.env.API_BASE_URL,
    //   apiTimeout: process.env.API_TIMEOUT,
    //   corsOrigin: process.env.CORS_ORIGIN
    // }
  }
})
