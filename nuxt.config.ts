// https://nuxt.com/docs/api/configuration/nuxt-config
import { type PreRenderedAsset } from 'rollup'
export default defineNuxtConfig({
  devtools: { enabled: true },
  // 启用服务端渲染
  ssr: true,
  app: {
    head: {
      title: process.env.APP_NAME,
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
        },
        {
          name: 'description',
          content: 'Data Middle Station'
        },
        {
          name: 'keywords',
          content: 'Data Middle Station'
        }
      ],
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
  css: ['~/assets/styles/main.css'],
  modules: ['@pinia/nuxt', '@element-plus/nuxt'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  // 添加对Less的支持和构建优化
  vite: {
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 1024, // 将警告体积变成1MB
      rollupOptions: {
        output: {
          // 配置 JS 文件命名格式：chunk名称 + hash
          chunkFileNames: '_nuxt/[name].[hash].js',
          entryFileNames: '_nuxt/[name].[hash].js',
          // 配置 CSS 文件命名格式（保持现有格式）
          assetFileNames: (assetInfo: PreRenderedAsset) => {
            const name = assetInfo.name || 'asset'
            const info = name.split('.')
            const ext = info[info.length - 1]
            if (/\.(css)$/.test(name)) {
              return `_nuxt/[name].[hash].${ext}`
            }
            return `_nuxt/[name].[hash].[ext]`
          },
          /**
           * 安全的代码分割策略
           *
           * ⚠️ 核心原则：不要分离框架核心，避免破坏 Nuxt 初始化顺序
           *
           * 禁止分离的库（必须让 Vite 自动处理）：
           * - vue, @vue/*           (Vue 核心)
           * - pinia, @pinia/*       (状态管理，依赖 Vue 实例)
           * - vue-router            (路由，依赖 Vue 实例)
           * - nuxt, @nuxt/*, #app   (Nuxt 框架核心)
           *
           * 可以安全分离的库：
           * - 大型独立的第三方库（Monaco、图表库等）
           * - 工具类库（dayjs、lodash 等）
           * - UI 组件库（Element Plus，但要注意它由 Nuxt Module 管理）
           */
          manualChunks: (id) => {
            // 非 node_modules 的业务代码不分割
            if (!id.includes('node_modules')) {
              return undefined
            }

            // 1. 大型编辑器库（~3MB，相对独立，适合单独分包）
            if (id.includes('monaco-editor')) {
              return 'monaco-editor'
            }

            // 2. 大型图表库（~500KB+，相对独立）
            if (id.includes('@antv/g2')) {
              return 'antv-g2'
            }

            // 3. Canvas 渲染库（~200KB+，相对独立）
            if (id.includes('konva')) {
              return 'konva'
            }

            // 4. UI 组件库
            // Element Plus 通过 @element-plus/nuxt 模块加载
            // Nuxt 会确保 Vue 先初始化，所以相对安全
            if (id.includes('element-plus')) {
              return 'element-plus'
            }

            // 5. 日期处理库（小型工具库，可选）
            if (id.includes('dayjs')) {
              return 'dayjs'
            }

            // 6. Icon 库（如果体积大可以分离）
            if (id.includes('@icon-park')) {
              return 'icon-park'
            }

            // ⚠️ 重要：其他所有依赖都返回 undefined
            // 让 Vite 根据依赖关系自动打包，特别是：
            // - Vue 相关（vue、@vue/*）
            // - Pinia 相关（pinia、@pinia/*）
            // - Vue Router
            // - Nuxt 核心
            // 这些库的加载顺序至关重要，不能手动分离！
            return undefined
          }
        }
      }
    }
  },
  nitro: {
    esbuild: {
      options: {
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true
          }
        }
      }
    },
    // 启用压缩
    compressPublicAssets: true,
    // 外部依赖配置，防止 tslib 等依赖打包错误
    externals: {
      inline: ['tslib']
    },
    // 服务端路由缓存
    routeRules: {
      // API 路由缓存配置
      '/api/**': {
        headers: {
          'Cache-Control': 's-maxage=300' // 5分钟缓存
        }
      },
      // 静态资源缓存
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 's-maxage=31536000' // 1年缓存
        }
      }
    }
  },
  // 构建优化配置
  build: {},
  runtimeConfig: {
    // 服务端私有键（仅在服务器端可用）
    serviceDbName: process.env.SERVICE_DB_NAME,
    serviceDbHost: process.env.SERVICE_DB_HOST,
    serviceDbPort: String(process.env.SERVICE_DB_PORT),
    serviceDbUser: process.env.SERVICE_DB_USER,
    serviceDbPwd: process.env.SERVICE_DB_PASSWORD,
    serviceDbTimezone: process.env.SERVICE_DB_TIMEZONE,
    serviceDbStrings: String(process.env.SERVICE_DB_DATE_STRINGS),
    serviceDbDecimalNumbers: String(process.env.SERVICE_DB_DECIMAL_NUMBERS),

    serviceDataDbName: process.env.SERVICE_DATA_DB_NAME,
    serviceDataDbHost: process.env.SERVICE_DATA_DB_HOST,
    serviceDataDbPort: String(process.env.SERVICE_DATA_DB_PORT),
    serviceDataDbUser: process.env.SERVICE_DATA_DB_USER,
    serviceDataDbPwd: process.env.SERVICE_DATA_DB_PASSWORD,
    serviceDataDbTimezone: process.env.SERVICE_DATA_DB_TIMEZONE,
    serviceDataDbStrings: String(process.env.SERVICE_DATA_DB_DATE_STRINGS),
    serviceDataDbDecimalNumbers: String(process.env.SERVICE_DATA_DB_DECIMAL_NUMBERS),

    serviceRedisBase: process.env.SERVICE_REDIS_BASE,
    serviceRedisHost: process.env.SERVICE_REDIS_HOST,
    serviceRedisPort: String(process.env.SERVICE_REDIS_PORT),
    serviceRedisUsername: process.env.SERVICE_REDIS_USERNAME,
    serviceRedisPassword: process.env.SERVICE_REDIS_PASSWORD,
    serviceRedisDb: String(process.env.SERVICE_REDIS_DB),

    // 日志路径
    logPath: process.env.LOG_PATH,
    logTimeFormat: process.env.LOG_TIME_FORMAT,

    // JWT配置
    jwtSecretKey: process.env.JWT_SECRET_KEY,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,

    // 邮件SMTP配置
    smtpHost: process.env.SMTP_HOST,
    smtpPort: String(process.env.SMTP_PORT),
    smtpSecure: String(process.env.SMTP_SECURE),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM,

    // 公共键（在客户端和服务器端都可用）
    public: {
      apiBase: process.env.API_BASE,
      appName: process.env.APP_NAME
    }
  }
})
