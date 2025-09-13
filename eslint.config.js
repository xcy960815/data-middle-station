const js = require('@eslint/js')
const typescript = require('@typescript-eslint/eslint-plugin')
const typescriptParser = require('@typescript-eslint/parser')
const vue = require('eslint-plugin-vue')
const vueParser = require('vue-eslint-parser')
const globals = require('globals')

module.exports = [
  // 忽略文件配置
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.nuxt/**',
      '.output/**',
      'coverage/**',
      '*.min.js',
      'public/**',
      'static/**',
      '.git/**',
      '*.config.js',
      'ecosystem.config.js',
      'changelog.config.js'
    ]
  },

  // JavaScript 基础配置
  js.configs.recommended,

  // TypeScript 文件配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        // Nuxt 全局变量
        defineNuxtPlugin: 'readonly',
        defineEventHandler: 'readonly',
        defineNuxtConfig: 'readonly',
        setHeader: 'readonly',
        setResponseHeaders: 'readonly',
        setResponseStatus: 'readonly',
        defineNitroPlugin: 'readonly',
        $fetch: 'readonly',
        useNuxtApp: 'readonly',
        useRuntimeConfig: 'readonly',
        navigateTo: 'readonly',
        useState: 'readonly',
        useCookie: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        useLazyFetch: 'readonly',
        useFetch: 'readonly',
        definePageMeta: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        readBody: 'readonly',
        getQuery: 'readonly',
        getHeader: 'readonly',
        getRequestURL: 'readonly',
        setCookie: 'readonly',
        getCookie: 'readonly',
        createError: 'readonly',
        useNitroApp: 'readonly',
        useStorage: 'readonly',
        // Vue 全局变量 (在 TS 文件中也可能用到)
        defineComponent: 'readonly',
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
        computed: 'readonly',
        ref: 'readonly',
        reactive: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        onBeforeUnmount: 'readonly',
        nextTick: 'readonly',
        toRef: 'readonly',
        toRefs: 'readonly',
        toRaw: 'readonly',
        inject: 'readonly',
        provide: 'readonly',
        h: 'readonly',
        // TypeScript 全局变量
        PropType: 'readonly',
        ExtractPropTypes: 'readonly',
        Ref: 'readonly',
        ComputedRef: 'readonly',
        // Pinia store 全局变量
        defineStore: 'readonly',
        // 项目自定义类型
        ChartDataVo: 'readonly',
        GroupStore: 'readonly',
        DimensionStore: 'readonly',
        ColumnStore: 'readonly',
        FilterStore: 'readonly',
        OrderStore: 'readonly',
        AnalyseStore: 'readonly',
        ChartConfigStore: 'readonly',
        ChartConfigVo: 'readonly',
        UserStore: 'readonly',
        HomePageStore: 'readonly',
        BaseStore: 'readonly',
        DatabaseVo: 'readonly',
        AnalyseVo: 'readonly',
        UserInfoVo: 'readonly',
        RequestCodeEnum: 'readonly',
        ChartDataDto: 'readonly',
        ChartDataDao: 'readonly',
        ChartConfigDto: 'readonly',
        ChartConfigDao: 'readonly',
        AnalyseDto: 'readonly',
        AnalyseDao: 'readonly',
        DatabaseDao: 'readonly',
        LoginDto: 'readonly',
        SendEmailDtoDto: 'readonly',
        LoginVo: 'readonly',
        ApiResponse: 'readonly',
        // 工具类
        Logger: 'readonly',
        JwtUtils: 'readonly',
        RedisStorage: 'readonly',
        ApiResponse: 'readonly',
        // 工具函数
        exportToExcel: 'readonly',
        toLine: 'readonly',
        convertToSqlProperties: 'readonly',
        batchFormatSqlKey: 'readonly',
        batchFormatSqlSet: 'readonly',
        serverSleep: 'readonly',
        defaultTableChartConfig: 'readonly',
        // Store 函数
        useAnalyseStore: 'readonly',
        useColumnStore: 'readonly',
        useDimensionStore: 'readonly',
        useFilterStore: 'readonly',
        useGroupStore: 'readonly',
        useOrderStore: 'readonly',
        useChartConfigStore: 'readonly',
        useUserStore: 'readonly',
        useHomepageStore: 'readonly',
        // 其他全局类型
        DragData: 'readonly',
        ContextMenu: 'readonly',
        NodeJS: 'readonly',
        EventListener: 'readonly',
        ConditionOption: 'readonly',
        Webworker: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'off',
      'no-case-declarations': 'warn',
      'no-empty-pattern': 'warn'
    }
  },

  // Vue 文件配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        // Nuxt 全局变量
        defineNuxtPlugin: 'readonly',
        defineEventHandler: 'readonly',
        defineNuxtConfig: 'readonly',
        setHeader: 'readonly',
        setResponseHeaders: 'readonly',
        setResponseStatus: 'readonly',
        defineNitroPlugin: 'readonly',
        $fetch: 'readonly',
        useNuxtApp: 'readonly',
        useRuntimeConfig: 'readonly',
        navigateTo: 'readonly',
        useState: 'readonly',
        useCookie: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        useLazyFetch: 'readonly',
        useFetch: 'readonly',
        definePageMeta: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        readBody: 'readonly',
        getQuery: 'readonly',
        getHeader: 'readonly',
        getRequestURL: 'readonly',
        setCookie: 'readonly',
        getCookie: 'readonly',
        createError: 'readonly',
        useNitroApp: 'readonly',
        useStorage: 'readonly',
        // Vue 全局变量
        defineComponent: 'readonly',
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
        computed: 'readonly',
        ref: 'readonly',
        reactive: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        onBeforeUnmount: 'readonly',
        nextTick: 'readonly',
        toRef: 'readonly',
        toRefs: 'readonly',
        toRaw: 'readonly',
        inject: 'readonly',
        provide: 'readonly',
        h: 'readonly',
        // TypeScript 全局变量
        PropType: 'readonly',
        ExtractPropTypes: 'readonly',
        Ref: 'readonly',
        ComputedRef: 'readonly',
        // Pinia store 全局变量
        defineStore: 'readonly',
        // 项目自定义类型
        ChartDataVo: 'readonly',
        GroupStore: 'readonly',
        DimensionStore: 'readonly',
        ColumnStore: 'readonly',
        FilterStore: 'readonly',
        OrderStore: 'readonly',
        AnalyseStore: 'readonly',
        ChartConfigStore: 'readonly',
        ChartConfigVo: 'readonly',
        UserStore: 'readonly',
        HomePageStore: 'readonly',
        BaseStore: 'readonly',
        DatabaseVo: 'readonly',
        AnalyseVo: 'readonly',
        UserInfoVo: 'readonly',
        RequestCodeEnum: 'readonly',
        ChartDataDto: 'readonly',
        ChartConfigDto: 'readonly',
        ChartConfigDao: 'readonly',
        AnalyseDto: 'readonly',
        AnalyseDao: 'readonly',
        DatabaseDao: 'readonly',
        LoginDto: 'readonly',
        SendEmailDtoDto: 'readonly',
        LoginVo: 'readonly',
        ApiResponse: 'readonly',
        // 工具类
        Logger: 'readonly',
        JwtUtils: 'readonly',
        RedisStorage: 'readonly',
        ApiResponse: 'readonly',
        // 工具函数
        exportToExcel: 'readonly',
        toLine: 'readonly',
        convertToSqlProperties: 'readonly',
        batchFormatSqlKey: 'readonly',
        batchFormatSqlSet: 'readonly',
        serverSleep: 'readonly',
        defaultTableChartConfig: 'readonly',
        // Store 函数
        useAnalyseStore: 'readonly',
        useColumnStore: 'readonly',
        useDimensionStore: 'readonly',
        useFilterStore: 'readonly',
        useGroupStore: 'readonly',
        useOrderStore: 'readonly',
        useChartConfigStore: 'readonly',
        useUserStore: 'readonly',
        useHomepageStore: 'readonly',
        // Chart.js
        Chart: 'readonly',
        // Lodash
        debounce: 'readonly',
        // 其他全局类型
        DragData: 'readonly',
        ContextMenu: 'readonly',
        NodeJS: 'readonly',
        EventListener: 'readonly',
        ConditionOption: 'readonly',
        Webworker: 'readonly'
      }
    },
    plugins: {
      vue,
      '@typescript-eslint': typescript
    },
    rules: {
      // Vue 规则自定义
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-multiple-template-root': 'off',
      // TypeScript 规则自定义
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'off',
      'no-case-declarations': 'warn',
      'no-empty-pattern': 'warn'
    }
  },

  // TypeScript 声明文件配置
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },

  // JavaScript 文件配置
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  }
]
