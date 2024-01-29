// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'path'
export default defineNuxtConfig({
  app: {
    head: {
      title: 'blog-home-nuxt',
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
    '~/assets/css/main.css',
    // 加载全局 less
    '~/assets/less/theme.scss',
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
    disableVuex: true,
    autoImports: [
      // 自动引入 `defineStore()` 并重命名为 `definePiniaStore()`
      ['defineStore', 'definePiniaStore']
    ]
  },
  plugins: [
    {
      src: '../plugins/client/common-watermark.ts',
      mode: 'client'
    },
    {
      src: '../plugins/client/monaco-worker.ts',
      mode: 'client'
    },
    {
      src: '../plugins/client/socket.ts',
      mode: 'client'
    },
    {
      src: '../plugins/client/iconify.ts',
      mode: 'client'
    },
    {
      src: '../plugins/client/webworker.ts',
      mode: 'client'
    },
    {
      src: '../plugins/all/context-menu.ts',
      mode: 'all'
    },
    {
      src: '../plugins/all/element-iconfont.ts',
      mode: 'all'
    },
    {
      src: '../plugins/all/element-plus.ts',
      mode: 'all'
    }
    // {
    //   src: '../plugins/all/table-stick.ts',
    //   mode: 'all'
    // }
  ],
  
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
  }
})
