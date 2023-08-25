<template>
  <Teleport :to="teleport" v-if="teleport">
    <Transition
      @before-enter="handleBeforeEnter"
      @enter="handleEnter"
      @after-enter="handleAfterEnter"
    >
      <div
        class="contextmenu"
        ref="contextmenuElement"
        v-show="visible"
        :style="contextMenuPositionStyle"
      >
        <ul class="contextmenu-inner">
          <slot></slot>
        </ul>
      </div>
    </Transition>
  </Teleport>
  <Transition
    @before-enter="handleBeforeEnter"
    @enter="handleEnter"
    @after-enter="handleAfterEnter"
    v-else
  >
    <div
      class="contextmenu"
      ref="contextmenuElement"
      v-show="visible"
      :style="contextMenuPositionStyle"
    >
      <ul class="contextmenu-inner">
        <slot></slot>
      </ul>
    </div>
  </Transition>
</template>
<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  autoAjustPlacement: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  teleport: {
    type: String,
    default: () => 'body',
  },
});

const emits = defineEmits(['show', 'hide', 'update:modelValue']);
// 右键菜单的元素
const contextmenuElement = ref<HTMLDivElement | null>(null);
// 右键菜单是否显示
const visible = ref(props.modelValue || false);
/**
 * @desc 更新右键菜单的显示状态
 * @param {boolean} value
 */
const updateModelValue = (value: boolean) => {
  visible.value = value;
  emits('update:modelValue', value);
};
// 右键菜单的位置
const contextMenuPosition = ref({ top: 0, left: 0 });
/**
 * @desc 右键菜单的位置
 * @type {ComputedRef<{ top: string; left: string }>}
 */
const contextMenuPositionStyle = computed(() => ({
  top: `${contextMenuPosition.value.top}px`,
  left: `${contextMenuPosition.value.left}px`,
}));

/**
 * @desc 显示菜单
 * @param { MouseEvent } evt
 * @returns {void}
 */
const showContextMenu = (evt: MouseEvent) => {
  evt.preventDefault();
  const autoAjustPlacement = props.autoAjustPlacement;
  const targetPosition = {
    top: evt.pageY,
    left: evt.pageX,
  };
  updateModelValue(true);
  nextTick(() => {
    if (autoAjustPlacement) {
      const contextmenuNode = contextmenuElement.value;
      if (!contextmenuNode) return;
      const contextmenuWidth = contextmenuNode.clientWidth;
      const contextmenuHeight = contextmenuNode.clientHeight;
      // 如果右键菜单超出了可视区域，需要调整位置
      if (contextmenuHeight + targetPosition.top >= window.innerHeight + window.scrollY) {
        const targetTop = targetPosition.top - contextmenuHeight;
        if (targetTop > window.scrollY) {
          targetPosition.top = targetTop;
        }
      }
      if (contextmenuWidth + targetPosition.left >= window.innerWidth + window.scrollX) {
        const targetWidth = targetPosition.left - contextmenuWidth;
        if (targetWidth > window.scrollX) {
          targetPosition.left = targetWidth;
        }
      }
    }
    contextMenuPosition.value = targetPosition;
    emits('show');
  });
};
/**
 * @desc 隐藏菜单
 */
const hideContextMenu = () => {
  updateModelValue(false);
  // TODO: 添加回掉参数
  emits('hide');
};
/**
 * @desc 当dom元素进入到页面之前
 * @param {Element} el
 */
const handleBeforeEnter = (el: Element) => {
  (el as HTMLDivElement).style.height = '0';
};
/**
 * @desc 当dom元素进入到页面之后
 * @param {Element} el
 */
const handleEnter = (el: Element) => {
  (el as HTMLDivElement).style.height = 'auto';
  const realHeight = window.getComputedStyle(el).height;
  (el as HTMLDivElement).style.height = '0';
  requestAnimationFrame(() => {
    (el as HTMLDivElement).style.height = realHeight;
    (el as HTMLDivElement).style.transition = 'height .5s';
  });
};
/**
 * @desc 当dom元素进入到页面之后
 * @param {Element} el
 */
const handleAfterEnter = (el: Element) => {
  (el as HTMLDivElement).style.transition = 'none';
};
/**
 * @desc 触发元素的配置
 */
const contextMenuOptions = reactive<Map<Element, ContextMenuModule.ContextMenuOtions>>(new Map());
/**
 * @desc 当前触发元素
 * @type {Ref<ContextMenuModule.ContextMenuElement>}
 */
const currentReferenceElement = ref<ContextMenuModule.ContextMenuElement>();
/**
 * @desc 当前触发元素的配置
 * @type {ComputedRef<ContextMenuModule.ContextMenuOptions>}
 */
const currentTriggerOptions = computed(
  () => currentReferenceElement.value && contextMenuOptions.get(currentReferenceElement.value),
);
/**
 * @desc 添加触发元素
 * @param {ContextMenuModule.ContextMenuElement} contextMenuElement
 * @param {ContextMenuModule.InitContextMenuOptions} options
 * @returns {void}
 */
const initContextMenuEvent = (
  contextMenuElement: ContextMenuModule.ContextMenuElement,
  options?: ContextMenuModule.InitContextMenuOptions,
): void => {
  // 获取用户的触发方式
  const triggerTypes: ContextMenuModule.TriggerType[] = options?.triggerTypes
    ? Array.isArray(options.triggerTypes)
      ? options.triggerTypes
      : [options.triggerTypes]
    : ['contextmenu'];
  /**
   * @desc 触发事件
   * @param {Event} evt
   * @returns {void}
   */
  const triggerEventHandler = (evt: Event) => {
    if (props.disabled) return;
    currentReferenceElement.value = contextMenuElement;
    showContextMenu(evt as MouseEvent);
  };
  /**
   * @desc 循环绑定事件
   * @param {ContextMenuModule.TriggerType} triggerType
   * @returns {void}
   */
  triggerTypes.forEach((triggerType) => {
    contextMenuElement.addEventListener(triggerType, triggerEventHandler);
  });
  /**
   * @desc 保存触发元素
   */
  contextMenuOptions.set(contextMenuElement, {
    triggerTypes,
    triggerEventHandler,
  });
};
/**
 * @desc 移除触发元素
 * @param {ContextMenuModule.ContextMenuElement} contextMenuElement
 * @returns {void}
 */
const removeContextMenuEvent = (contextMenuElement: ContextMenuModule.ContextMenuElement): void => {
  const options = contextMenuOptions.get(contextMenuElement);
  if (!options) return;
  options.triggerTypes.forEach((triggerType) => {
    contextMenuElement.removeEventListener(triggerType, options.triggerEventHandler);
  });
  contextMenuOptions.delete(contextMenuElement);
};
/**
 * @desc 当用户点击body时，隐藏菜单
 * @param {Event} evt
 * @returns {void}
 */
const handleClickBody = (evt: Event): void => {
  if (!evt.target || !contextmenuElement.value || !currentReferenceElement.value) return;
  const notOutside =
    contextmenuElement.value.contains(evt.target as Node) ||
    (currentTriggerOptions.value &&
      currentTriggerOptions.value.triggerTypes.includes('click') &&
      currentReferenceElement.value.contains(evt.target as Node));
  if (!notOutside) {
    updateModelValue(false);
  }
};
/**
 * @desc 监听modelValue的变化
 */
watch(visible, (value) => {
  if (value) {
    // 显示菜单时，添加事件监听
    document.addEventListener('click', handleClickBody);
  } else {
    // 隐藏菜单时，移除事件监听
    document.removeEventListener('click', handleClickBody);
  }
});
/**
 * @desc 当用户离开页面时，移除事件监听
 */
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickBody);
});

provide('visible', visible);
provide('autoAjustPlacement', props.autoAjustPlacement);
provide('show', showContextMenu);
provide('hide', hideContextMenu);

defineExpose({
  initContextMenuEvent,
  removeContextMenuEvent,
});
</script>
