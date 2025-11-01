import type { DefineComponent } from 'vue'

declare const Component: DefineComponent<
  {
    title?: string
    disabled?: boolean
  },
  Record<string, never>,
  {
    default?: () => unknown
  },
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  {
    mouseenter: [evt: Event]
    mouseleave: [evt: Event]
  }
>

export default Component
