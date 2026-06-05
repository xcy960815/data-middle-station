<template>
  <Teleport :to="teleport" v-if="teleport">
    <Transition name="contextmenu">
      <div
        class="contextmenu"
        ref="contextmenuElement"
        v-show="visible"
        :class="{ 'contextmenu--measuring': measuring }"
        :style="contextMenuPositionStyle"
      >
        <ul class="contextmenu-inner">
          <slot></slot>
        </ul>
      </div>
    </Transition>
  </Teleport>
  <Transition v-else name="contextmenu">
    <div
      class="contextmenu"
      ref="contextmenuElement"
      v-show="visible"
      :class="{ 'contextmenu--measuring': measuring }"
      :style="contextMenuPositionStyle"
    >
      <ul class="contextmenu-inner">
        <slot></slot>
      </ul>
    </div>
  </Transition>
</template>
<script lang="ts">
let activeContextMenu: (() => void) | null = null
</script>
<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  teleport: {
    type: String,
    default: () => 'body'
  }
})

const emits = defineEmits(['show', 'hide', 'update:modelValue'])

// 右键菜单的元素
const contextmenuElement = ref<HTMLDivElement | null>(null)
// 右键菜单是否显示
const visible = ref(props.modelValue)
const measuring = ref(false)
/**
 * @desc 更新右键菜单的显示状态
 * @param {boolean} value
 */
const updateModelValue = (value: boolean) => {
  visible.value = value
  emits('update:modelValue', value)
}
// 右键菜单的位置
const contextMenuPosition = ref({ top: 0, left: 0 })
/**
 * @desc 右键菜单的位置
 * @type {ComputedRef<{ top: string; left: string }>}
 */
const contextMenuPositionStyle = computed(() => ({
  top: `${contextMenuPosition.value.top}px`,
  left: `${contextMenuPosition.value.left}px`
}))

/**
 * @desc 计算菜单位置，确保菜单不超出视口
 * @param {number} initialTop 初始 top 位置
 * @param {number} initialLeft 初始 left 位置
 * @param {number} menuWidth 菜单宽度
 * @param {number} menuHeight 菜单高度
 * @returns {{ top: number; left: number }} 调整后的位置
 */
const calculateMenuPosition = (
  initialTop: number,
  initialLeft: number,
  menuWidth: number,
  menuHeight: number
): { top: number; left: number } => {
  const viewportLeft = window.scrollX
  const viewportTop = window.scrollY
  const viewportRight = viewportLeft + window.innerWidth
  const viewportBottom = viewportTop + window.innerHeight

  const maxLeft = Math.max(viewportLeft, viewportRight - menuWidth)
  const maxTop = Math.max(viewportTop, viewportBottom - menuHeight)
  const adjustedLeft = Math.min(Math.max(initialLeft, viewportLeft), maxLeft)
  const adjustedTop = Math.min(Math.max(initialTop, viewportTop), maxTop)

  return { top: adjustedTop, left: adjustedLeft }
}

/**
 * @desc 显示菜单
 * @param { MouseEvent } evt
 * @returns {void}
 */
const showContextMenu = (evt: MouseEvent) => {
  evt.preventDefault()
  evt.stopPropagation()
  if (activeContextMenu && activeContextMenu !== hideContextMenu) {
    activeContextMenu()
  }
  activeContextMenu = hideContextMenu
  const initialPosition = {
    top: evt.pageY,
    left: evt.pageX
  }
  // 先把菜单放到鼠标处，先显示再测量尺寸，避免获取到 0 宽高
  contextMenuPosition.value = initialPosition
  measuring.value = true
  updateModelValue(true)
  nextTick(() => {
    const contextmenuNode = contextmenuElement.value
    if (!contextmenuNode) {
      measuring.value = false
      emits('show')
      return
    }
    // 使用 scrollWidth/scrollHeight，避免进入动画阶段 height 被置为 0 导致测量不准
    const menuWidth = Math.max(contextmenuNode.scrollWidth, contextmenuNode.offsetWidth)
    const menuHeight = Math.max(contextmenuNode.scrollHeight, contextmenuNode.offsetHeight)

    contextMenuPosition.value = calculateMenuPosition(initialPosition.top, initialPosition.left, menuWidth, menuHeight)
    requestAnimationFrame(() => {
      measuring.value = false
      // 保持原有行为，触发展示事件
      emits('show')
    })
  })
}
/**
 * @desc 隐藏菜单
 */
const hideContextMenu = () => {
  updateModelValue(false)
  if (activeContextMenu === hideContextMenu) {
    activeContextMenu = null
  }
  // TODO: 添加回掉参数
  emits('hide')
}
/**
 * @desc 触发元素的配置
 */
const contextMenuOptions = ref<Map<Element, ContextMenu.ContextMenuOptions>>(new Map())
/**
 * @desc 当前触发元素
 * @type {Ref<ContextMenu.ContextMenuElement>}
 */
const currentReferenceElement = ref<ContextMenu.ContextMenuElement>()
/**
 * @desc 添加触发元素
 * @param {ContextMenu.ContextMenuElement} contextMenuElement
 * @param {ContextMenu.InitContextMenuOptions} options
 * @returns {void}
 */
const initContextMenuEvent = (
  contextMenuElement: ContextMenu.ContextMenuElement,
  options?: ContextMenu.InitContextMenuOptions
): void => {
  // 获取用户的触发方式
  const triggerTypes: ContextMenu.TriggerType[] = options?.triggerTypes
    ? Array.isArray(options.triggerTypes)
      ? options.triggerTypes
      : [options.triggerTypes]
    : ['contextmenu']
  /**
   * @desc 触发事件
   * @param {Event} evt
   * @returns {void}
   */
  const triggerEventHandler = (evt: Event) => {
    if (props.disabled) return
    currentReferenceElement.value = contextMenuElement
    showContextMenu(evt as MouseEvent)
  }
  /**
   * @desc 循环绑定事件
   * @param {ContextMenu.TriggerType} triggerType
   * @returns {void}
   */
  triggerTypes.forEach((triggerType) => {
    contextMenuElement.addEventListener(triggerType, triggerEventHandler)
  })
  /**
   * @desc 保存触发元素
   */
  contextMenuOptions.value.set(contextMenuElement, {
    triggerTypes,
    triggerEventHandler
  })
}
/**
 * @desc 移除触发元素
 * @param {ContextMenu.ContextMenuElement} contextMenuElement
 * @returns {void}
 */
const removeContextMenuEvent = (contextMenuElement: ContextMenu.ContextMenuElement): void => {
  const options = contextMenuOptions.value.get(contextMenuElement)
  if (!options) return
  options.triggerTypes.forEach((triggerType) => {
    contextMenuElement.removeEventListener(triggerType, options.triggerEventHandler)
  })
  contextMenuOptions.value.delete(contextMenuElement)
}
/**
 * @desc 当用户点击body时，隐藏菜单
 * @param {Event} evt
 * @returns {void}
 */
const handleClickBody = (evt: Event): void => {
  if (!evt.target || !contextmenuElement.value) return
  // 只要点击不在菜单内就关闭菜单
  if (!contextmenuElement.value.contains(evt.target as Node)) {
    updateModelValue(false)
  }
}
// esc关闭菜单
const handleEscKey = (evt: KeyboardEvent) => {
  if (evt.key === 'Escape') {
    updateModelValue(false)
  }
}

// 同步 modelValue prop 到 visible
watch(
  () => props.modelValue,
  (value) => {
    visible.value = value
  }
)

watch(visible, (value) => {
  if (value) {
    // 显示菜单时，添加事件监听
    document.addEventListener('click', handleClickBody)
    document.addEventListener('keydown', handleEscKey)
  } else {
    // 隐藏菜单时，移除事件监听
    document.removeEventListener('click', handleClickBody)
    document.removeEventListener('keydown', handleEscKey)
  }
})
/**
 * @desc 当用户离开页面时，移除事件监听
 */
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickBody)
  document.removeEventListener('keydown', handleEscKey)
  if (activeContextMenu === hideContextMenu) {
    activeContextMenu = null
  }
})

provide('visible', visible)
provide('show', showContextMenu)
provide('hide', hideContextMenu)

defineExpose({
  initContextMenuEvent,
  removeContextMenuEvent,
  show: showContextMenu,
  hide: hideContextMenu
})
</script>
