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

  /**
   * @desc 右键菜单绑定
   */
  export interface ContextMenuBinding
    extends DirectiveBinding<{
      triggerTypes: TriggerType[]
    }> {}

  /**
   * @desc 右键菜单实例
   */
  export interface ContextMenuInstance {
    initContextMenuEvent(contextMenuElement: ContextMenuElement, options?: InitContextMenuOptions): void

    removeContextMenuEvent(contextMenuElement: ContextMenuElement): void
  }

  /**
   * @desc 初始化右键菜单选项
   */
  export interface InitContextMenuOptions {
    triggerTypes?: TriggerType | TriggerType[]
  }
}
