/**
 * @desc contextmenu directive and component definition
 */

declare namespace ContextMenu {
  type DirectiveBinding = import('vue').DirectiveBinding
  /**
   * @desc 右键菜单元素
   */
  export interface ContextMenuElement extends Element {
    $contextmenuRefName?: string
  }
  /**
   * @desc 触发方式
   */
  export type TriggerType = 'contextmenu' | 'click'
  /**
   * @desc 右键菜单配置项
   */
  export interface ContextMenuOtions {
    triggerTypes: TriggerType[]
    triggerEventHandler: (evt: Event) => void
  }

  export interface ContextMenuBinding
    extends DirectiveBinding<{
      triggerTypes: TriggerType[]
    }> {}

  export interface ContextMenuInstance {
    initContextMenuEvent(
      contextMenuElement: ContextMenuElement,
      options?: InitContextMenuOptions
    ): void

    removeContextMenuEvent(
      contextMenuElement: ContextMenuElement
    ): void
  }

  export interface InitContextMenuOptions {
    triggerTypes?: TriggerType | TriggerType[]
  }
}
