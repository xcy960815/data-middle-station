import type { DefineComponent } from 'vue'

/**
 * 通用 Vue 组件类型声明
 */
declare module '*.vue' {
  const component: DefineComponent<Record<string, never>, Record<string, never>, Record<string, never>>
  export default component
}

/**
 * 注意：具体组件的类型声明已移至组件目录下的 .d.ts 文件
 * - components/table-chart/components/*.vue.d.ts
 * - components/context-menu/*.vue.d.ts
 *
 * 这样可以更精确地匹配相对路径导入，并提供准确的类型定义（不使用 any）
 */
