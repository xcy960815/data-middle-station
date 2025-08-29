module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.nuxt/',
    '.output/',
    'coverage/',
    '*.min.js',
    'public/',
    'static/',
    '.git/',
    '*.config.js',
    'ecosystem.config.js',
    'changelog.config.js'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  globals: {
    defineNuxtPlugin: 'readonly',
    defineEventHandler: 'readonly',
    setHeader: 'readonly',
    setResponseHeaders: 'readonly',
    setResponseStatus: 'readonly',
    defineNitroPlugin: 'readonly',
    $fetch: 'readonly'
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',
    'vue/require-default-prop': 'off',
    'vue/no-multiple-template-root': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'off'
  },
  overrides: [
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    {
      files: ['*.d.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ]
}
