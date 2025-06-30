import type { DirectiveBinding } from 'vue'

class ContextMenuPlugin {
  /**
   * @desc 绑定右键菜单指令
   * @param { ContextMenu.ContextMenuElement } contextMenuElement
   * @param { DirectiveBinding } binding
   * @returns {void}
   */
  mounted(
    contextMenuElement: ContextMenu.ContextMenuElement,
    binding: DirectiveBinding
  ): void {
    const contextmenuRefName = binding.arg
    if (!contextmenuRefName) return
    const contextmenuOptions = binding.value
    const contextmenuInstance: ContextMenu.ContextMenuInstance =
      binding.instance?.$refs[
        contextmenuRefName
      ] as ContextMenu.ContextMenuInstance
    contextMenuElement.$contextmenuRefName =
      contextmenuRefName
    contextmenuInstance.initContextMenuEvent(
      contextMenuElement,
      contextmenuOptions
    )
  }
  /**
   * @desc 更新右键菜单指令
   * @param {ContextMenu.ContextMenuElement} contextMenuElement
   * @param {DirectiveBinding} binding
   */
  updated(
    contextMenuElement: ContextMenu.ContextMenuElement,
    binding: DirectiveBinding
  ): void {
    // this.unmounted(contextMenuElement, binding);
    // this.mounted(contextMenuElement, binding);
    const contextmenuRefName = binding.arg
    if (!contextmenuRefName) return
    const contextmenuOptions = binding.value
    const contextmenuInstance: ContextMenu.ContextMenuInstance =
      binding.instance?.$refs[
        contextmenuRefName
      ] as ContextMenu.ContextMenuInstance
    contextMenuElement.$contextmenuRefName =
      contextmenuRefName
    contextmenuInstance.initContextMenuEvent(
      contextMenuElement,
      contextmenuOptions
    )
  }
  /**
   * @desc 解绑右键菜单指令
   * @param {ContextMenu.ContextMenuElement} contextMenuElement
   * @param {DirectiveBinding} binding
   * @returns {void}
   */
  unmounted(
    contextMenuElement: ContextMenu.ContextMenuElement,
    binding: DirectiveBinding
  ): void {
    const contextmenuRefName =
      contextMenuElement.$contextmenuRefName

    if (!contextmenuRefName) return

    const contextmenuInstance: ContextMenu.ContextMenuInstance =
      binding.instance?.$refs[
        contextmenuRefName
      ] as ContextMenu.ContextMenuInstance

    contextmenuInstance?.removeContextMenuEvent(
      contextMenuElement
    )
  }
}
import '~/components/context-menu/themes/default/index.less'
/**
 * @desc 绑定右键菜单指令
 */
export default defineNuxtPlugin(({ vueApp }) => {
  const contextMenuPlugin = new ContextMenuPlugin()
  vueApp.directive('contextmenu', {
    mounted: contextMenuPlugin.mounted,
    updated: contextMenuPlugin.updated,
    unmounted: contextMenuPlugin.unmounted
  })
})
