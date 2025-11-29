import type { DefineComponent } from 'vue'

declare const Component: DefineComponent<
  {},
  {
    initContextMenuEvent: (contextMenuElement: Element, options?: any) => void
    removeContextMenuEvent: (contextMenuElement: Element) => void
    show: (evt: MouseEvent) => void
    hide: () => void
  },
  any
>
export default Component
