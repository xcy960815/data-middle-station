// https://nuxt.com/docs/api/configuration/nuxt-config
import { type PreRenderedAsset } from 'rollup'
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
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
  // 静态资源优化
  experimental: {
    renderJsonPayloads: false
  },
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
          manualChunks: (id) => {
            // Node modules 处理
            if (id.includes('node_modules')) {
              // Element Plus 组件库
              if (id.includes('element-plus')) {
                return 'element-plus'
              }

              // Monaco Editor 相关
              if (id.includes('monaco-editor')) {
                return 'monaco-editor'
              }

              // 图表库分离
              if (id.includes('konva')) {
                return 'konva'
              }
              if (id.includes('@antv/g2')) {
                return 'antv-g2'
              }

              // 图标库
              if (id.includes('@icon-park')) {
                return 'icon-park'
              }

              // 工具库
              if (id.includes('dayjs')) {
                return 'dayjs'
              }
              if (id.includes('xlsx')) {
                return 'xlsx'
              }
              if (id.includes('socket.io-client')) {
                return 'socket-io'
              }
              if (id.includes('pinia')) {
                return 'pinia'
              }

              // Vue 相关核心库
              if (id.includes('vue') && !id.includes('vue-router')) {
                return 'vue-core'
              }
              if (id.includes('vue-router')) {
                return 'vue-router'
              }

              // 其他大型库
              if (id.includes('lodash')) {
                return 'lodash'
              }

              // 剩余的 node_modules 归为 vendor
              return 'vendor'
            }

            // 更精细的业务组件分包

            // Table Chart 组件细分
            if (id.includes('components/table-chart/render/')) {
              return 'table-chart-render'
            }
            if (id.includes('components/table-chart/dropdown/')) {
              return 'table-chart-dropdown'
            }
            if (id.includes('components/table-chart/konva-stage-handler')) {
              return 'table-chart-konva'
            }
            if (id.includes('components/table-chart/variable-handlder')) {
              return 'table-chart-vars'
            }
            if (id.includes('components/table-chart')) {
              return 'table-chart-core'
            }

            // Monaco Editor 组件
            if (id.includes('components/monaco-editor')) {
              return 'monaco-editor-comp'
            }

            // 其他图表组件
            if (id.includes('components/chart')) {
              return 'charts'
            }

            // 页面组件按路由分包
            if (id.includes('pages/analyse')) {
              return 'page-analyse'
            }
            if (id.includes('pages/indexdb')) {
              return 'page-indexdb'
            }
            if (id.includes('pages/welcome')) {
              return 'page-welcome'
            }
            if (id.includes('pages/')) {
              return 'pages-other'
            }

            // Composables 分包
            if (id.includes('composables/')) {
              return 'composables'
            }

            // Utils 分包
            if (id.includes('utils/')) {
              return 'utils'
            }

            // Server API 分包
            if (id.includes('server/')) {
              return 'server-api'
            }
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
    // 预渲染路由以提高首屏加载速度
    prerender: {
      routes: ['/']
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
