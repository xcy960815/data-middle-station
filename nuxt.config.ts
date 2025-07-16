// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'path'
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,
  experimental: {
    renderJsonPayloads: false
  },
  app: {
    head: {
      title: process.env.APP_NAME,
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
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
  modules: ['@pinia/nuxt'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
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
    }
  },
  runtimeConfig: {
    // 服务端私有键（仅在服务器端可用）
    serviceDbName: process.env.SERVICE_DB_NAME,
    serviceDbHost: process.env.SERVICE_DB_HOST,
    serviceDbPort: String(process.env.SERVICE_DB_PORT),
    serviceDbUser: process.env.SERVICE_DB_USER,
    serviceDbPwd: process.env.SERVICE_DB_PASSWORD,
    serviceDbTimezone: process.env.SERVICE_DB_TIMEZONE,
    serviceDbStrings: String(
      process.env.SERVICE_DB_DATE_STRINGS
    ),

    serviceDataDbName: process.env.SERVICE_DATA_DB_NAME,
    serviceDataDbHost: process.env.SERVICE_DATA_DB_HOST,
    serviceDataDbPort: String(
      process.env.SERVICE_DATA_DB_PORT
    ),
    serviceDataDbUser: process.env.SERVICE_DATA_DB_USER,
    serviceDataDbPwd: process.env.SERVICE_DATA_DB_PASSWORD,
    serviceDataDbTimezone:
      process.env.SERVICE_DATA_DB_TIMEZONE,
    serviceDataDbStrings: String(
      process.env.SERVICE_DATA_DB_DATE_STRINGS
    ),

    serviceRedisBase: process.env.SERVICE_REDIS_BASE,
    serviceRedisHost: process.env.SERVICE_REDIS_HOST,
    serviceRedisPort: String(
      process.env.SERVICE_REDIS_PORT
    ),
    serviceRedisUsername:
      process.env.SERVICE_REDIS_USERNAME,
    serviceRedisPassword:
      process.env.SERVICE_REDIS_PASSWORD,
    serviceRedisDb: String(process.env.SERVICE_REDIS_DB),

    // 日志路径
    logPath: process.env.LOG_PATH,
    logTimeFormat: process.env.LOG_TIME_FORMAT,

    // JWT配置
    jwtSecretKey: process.env.JWT_SECRET_KEY,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,

    // 公共键（在客户端和服务器端都可用）
    public: {
      apiBase: '/api',
      appName: process.env.APP_NAME
    }
  }
})
