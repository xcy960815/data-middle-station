import type { DefineComponent } from 'vue'

declare const Component: DefineComponent<
  {
    disabled?: boolean
    hideOnClick?: boolean
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
    click: [evt: Event]
    mouseenter: [evt: Event]
    mouseleave: [evt: Event]
  }
>

export default Component
