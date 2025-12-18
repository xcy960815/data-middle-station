import type { DefineComponent } from 'vue'

declare const Component: DefineComponent<
  {},
  {
    initContextMenuEvent: (contextMenuElement: Element, options?: ContextMenu.InitContextMenuOptions) => void
    removeContextMenuEvent: (contextMenuElement: Element) => void
    show: (evt: MouseEvent) => void
    hide: () => void
  },
  {},
  {},
  {},
  {},
  {},
  {}
>
export default Component
