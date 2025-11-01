import type { DefineComponent } from 'vue'
import type { ContextMenu } from '~/types/plugins/ContextMenu'

declare const Component: DefineComponent<
  {
    modelValue?: boolean
    disabled?: boolean
    teleport?: string
  },
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  {
    show: []
    hide: []
    'update:modelValue': [value: boolean]
  }
> & {
  initContextMenuEvent: (
    contextMenuElement: ContextMenu.ContextMenuElement,
    options?: ContextMenu.InitContextMenuOptions
  ) => void
  removeContextMenuEvent: (contextMenuElement: ContextMenu.ContextMenuElement) => void
  show: (evt: MouseEvent) => void
  hide: () => void
}

export default Component
export type ContextMenuElement = ContextMenu.ContextMenuElement
export type ContextMenuInstance = ContextMenu.ContextMenuInstance
export type InitContextMenuOptions = ContextMenu.InitContextMenuOptions
export type TriggerType = ContextMenu.TriggerType
