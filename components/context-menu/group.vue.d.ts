import type { DefineComponent } from 'vue'

declare const Component: DefineComponent<
  {
    title?: string
    maxWidth?: number | string
  },
  Record<string, never>,
  {
    title?: () => unknown
    default?: () => unknown
  },
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>
>

export default Component
