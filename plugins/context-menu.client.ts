import type { DirectiveBinding } from 'vue'
import ContextMenuDivider from '../components/context-menu/divider.vue'
import ContextMenuGroup from '../components/context-menu/group.vue'
import ContextMenuIcon from '../components/context-menu/Icon.vue'
import ContextMenu from '../components/context-menu/index.vue'
import ContextMenuItem from '../components/context-menu/Item.vue'
import ContextMenuSubmenu from '../components/context-menu/submenu.vue'
import '../components/context-menu/themes/default/index.less'

class ContextMenuPlugin {
  /**
   * @desc 绑定右键菜单指令
   * @param { ContextMenu.ContextMenuElement } contextMenuElement
   * @param { DirectiveBinding } binding
   * @returns {void}
   */
  mounted(contextMenuElement: ContextMenu.ContextMenuElement, binding: DirectiveBinding): void {
    const contextmenuRefName = binding.arg
    if (!contextmenuRefName) return
    const contextmenuOptions = binding.value
    const contextmenuInstance: ContextMenu.ContextMenuInstance = binding.instance?.$refs[
      contextmenuRefName
    ] as ContextMenu.ContextMenuInstance
    contextMenuElement.$contextmenuRefName = contextmenuRefName
    contextmenuInstance.initContextMenuEvent(contextMenuElement, contextmenuOptions)
  }
  /**
   * @desc 更新右键菜单指令
   * @param {ContextMenu.ContextMenuElement} contextMenuElement
   * @param {DirectiveBinding} binding
   */
  updated(contextMenuElement: ContextMenu.ContextMenuElement, binding: DirectiveBinding): void {
    const contextmenuRefName = binding.arg
    if (!contextmenuRefName) return
    const contextmenuOptions = binding.value
    const contextmenuInstance: ContextMenu.ContextMenuInstance = binding.instance?.$refs[
      contextmenuRefName
    ] as ContextMenu.ContextMenuInstance
    contextMenuElement.$contextmenuRefName = contextmenuRefName
    contextmenuInstance.initContextMenuEvent(contextMenuElement, contextmenuOptions)
  }
  /**
   * @desc 解绑右键菜单指令
   * @param {ContextMenu.ContextMenuElement} contextMenuElement
   * @param {DirectiveBinding} binding
   * @returns {void}
   */
  unmounted(contextMenuElement: ContextMenu.ContextMenuElement, binding: DirectiveBinding): void {
    const contextmenuRefName = contextMenuElement.$contextmenuRefName

    if (!contextmenuRefName) return

    const contextmenuInstance: ContextMenu.ContextMenuInstance = binding.instance?.$refs[
      contextmenuRefName
    ] as ContextMenu.ContextMenuInstance

    contextmenuInstance?.removeContextMenuEvent(contextMenuElement)
  }
}
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

  // 全局注册组件
  vueApp.component('ContextMenu', ContextMenu)
  vueApp.component('ContextMenuItem', ContextMenuItem)
  vueApp.component('ContextMenuSubmenu', ContextMenuSubmenu)
  vueApp.component('ContextMenuDivider', ContextMenuDivider)
  vueApp.component('ContextMenuGroup', ContextMenuGroup)
  vueApp.component('ContextMenuIcon', ContextMenuIcon)
})
