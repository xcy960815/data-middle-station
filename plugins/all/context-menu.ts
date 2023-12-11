class ContextMenuPlugin {
  /**
   * @desc 绑定右键菜单指令
   * @param { ContextMenuModule.ContextMenuElement } contextMenuElement
   * @param { ContextMenuModule.ContextMenuBinding } contextMenuBinding
   * @returns {void}
   */
  mounted(
    contextMenuElement: ContextMenuModule.ContextMenuElement,
    contextMenuBinding: ContextMenuModule.ContextMenuBinding,
  ): void {
    const contextmenuRefName = contextMenuBinding.arg;
    if (!contextmenuRefName) return;
    const contextmenuOptions = contextMenuBinding.value;
    const contextmenuInstance: ContextMenuModule.ContextMenuInstance = contextMenuBinding.instance
      ?.$refs[contextmenuRefName] as ContextMenuModule.ContextMenuInstance;
    contextMenuElement.$contextmenuRefName = contextmenuRefName;
    contextmenuInstance.initContextMenuEvent(contextMenuElement, contextmenuOptions);
  }
  /**
   * @desc 更新右键菜单指令
   * @param {ContextMenuModule.ContextMenuElement} contextMenuElement
   * @param {ContextMenuModule.ContextMenuBinding} contextMenuBinding
   */
  updated(
    contextMenuElement: ContextMenuModule.ContextMenuElement,
    contextMenuBinding: ContextMenuModule.ContextMenuBinding,
  ): void {
    // this.unmounted(contextMenuElement, contextMenuBinding);
    // this.mounted(contextMenuElement, contextMenuBinding);
    const contextmenuRefName = contextMenuBinding.arg;
    if (!contextmenuRefName) return;
    const contextmenuOptions = contextMenuBinding.value;
    const contextmenuInstance: ContextMenuModule.ContextMenuInstance = contextMenuBinding.instance
      ?.$refs[contextmenuRefName] as ContextMenuModule.ContextMenuInstance;
    contextMenuElement.$contextmenuRefName = contextmenuRefName;
    contextmenuInstance.initContextMenuEvent(contextMenuElement, contextmenuOptions);
  }
  /**
   * @desc 解绑右键菜单指令
   * @param {ContextMenuModule.ContextMenuElement} contextMenuElement
   * @param {ContextMenuModule.ContextMenuBinding} contextMenuBinding
   * @returns {void}
   */
  unmounted(
    contextMenuElement: ContextMenuModule.ContextMenuElement,
    contextMenuBinding: ContextMenuModule.ContextMenuBinding,
  ): void {
    const contextmenuRefName = contextMenuElement.$contextmenuRefName;

    if (!contextmenuRefName) return;

    const contextmenuInstance: ContextMenuModule.ContextMenuInstance = contextMenuBinding.instance
      ?.$refs[contextmenuRefName] as ContextMenuModule.ContextMenuInstance;

    contextmenuInstance?.removeContextMenuEvent(contextMenuElement);
  }
}
import '~/components/context-menu/themes/default/index.less';
/**
 * @desc 绑定右键菜单指令
 */
export default defineNuxtPlugin(({ vueApp }) => {
  const contextMenuPlugin = new ContextMenuPlugin();
  vueApp.directive('contextmenu', {
    mounted: contextMenuPlugin.mounted,
    updated: contextMenuPlugin.updated,
    unmounted: contextMenuPlugin.unmounted,
  });
});
