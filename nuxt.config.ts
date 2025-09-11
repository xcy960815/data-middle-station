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
          // 简化代码分割配置，避免构建卡住
          manualChunks: (id) => {
            // 只对主要的 node_modules 进行分割
            if (id.includes('node_modules')) {
              // 大型库单独分包
              if (id.includes('element-plus')) {
                return 'element-plus'
              }
              if (id.includes('monaco-editor')) {
                return 'monaco-editor'
              }
              if (id.includes('@antv/g2')) {
                return 'antv-g2'
              }
              if (id.includes('konva')) {
                return 'konva'
              }
              if (id.includes('vue') && !id.includes('vue-router')) {
                return 'vue-core'
              }
              if (id.includes('vue-router')) {
                return 'vue-router'
              }
              // 其他库归为 vendor
              return 'vendor'
            }
            // 业务代码不进行复杂分割，避免构建问题
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
