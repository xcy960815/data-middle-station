<template>
  <li class="contextmenu-submenu" @mouseenter="handleMouseenter" @mouseleave="handleMouseleave">
    <div :class="titleClasses">
      {{ title }}
      <span class="contextmenu-submenu__arrow">
        <context-menu-icon name="right-arrow" />
      </span>
    </div>
    <div v-if="hoverSubmenu" ref="submenuElement" :class="subMenusClasses">
      <ul class="contextmenu-inner">
        <slot></slot>
      </ul>
    </div>
  </li>
</template>
<script lang="ts" setup>
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['mouseenter', 'mouseleave'])
/**
 * @desc titile的class
 */
const titleClasses = computed(() => ({
  ['contextmenu-item']: true,
  ['contextmenu-submenu__title']: true,
  ['contextmenu-item--hover']: hoverSubmenu.value,
  ['contextmenu-item--disabled']: props.disabled
}))
/**
 * @desc 子菜单的class
 */
const subMenusClasses = computed(() => ({
  ['contextmenu']: true,
  ['contextmenu-submenu__menus']: true,
  ['contextmenu-submenu__menus--top']: placements.value.includes('top'),
  ['contextmenu-submenu__menus--right']: placements.value.includes('right'),
  ['contextmenu-submenu__menus--bottom']: placements.value.includes('bottom'),
  ['contextmenu-submenu__menus--left']: placements.value.includes('left')
}))
const submenuElement = ref<HTMLDivElement | null>(null)
/**
 * @desc 子菜单的展示位置
 */
const placements = ref(['top', 'right'])
/**
 * @desc 是否hover
 */
const hoverSubmenu = ref(false)

/**
 * @desc 计算子菜单位置，确保不超出视口
 * @param {DOMRect} targetRect 目标元素的边界矩形
 * @param {number} submenuWidth 子菜单宽度
 * @param {number} submenuHeight 子菜单高度
 * @returns {string[]} 位置数组
 */
const calculateSubmenuPlacement = (targetRect: DOMRect, submenuWidth: number, submenuHeight: number): string[] => {
  const targetPlacements: string[] = []
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // 水平方向：优先右侧，超出则左侧
  if (targetRect.right + submenuWidth >= viewportWidth) {
    targetPlacements.push('left')
  } else {
    targetPlacements.push('right')
  }

  // 垂直方向：优先顶部，超出则底部
  if (targetRect.bottom + submenuHeight >= viewportHeight) {
    targetPlacements.push('bottom')
  } else {
    targetPlacements.push('top')
  }

  return targetPlacements
}

/**
 * @desc 鼠标进入事件
 * @param evt { Event }
 * @returns { void }
 */
const handleMouseenter = (evt: Event) => {
  if (props.disabled) return
  hoverSubmenu.value = true
  emits('mouseenter', evt)

  nextTick(() => {
    const { target } = evt
    if (!target || !submenuElement.value) return

    const targetElementRect = (target as HTMLElement).getBoundingClientRect()
    const submenuWidth = submenuElement.value.clientWidth
    const submenuHeight = submenuElement.value.clientHeight

    placements.value = calculateSubmenuPlacement(targetElementRect, submenuWidth, submenuHeight)
  })
}
/**
 * @desc 鼠标离开事件
 * @param evt { Event }
 * @returns { void }
 */
const handleMouseleave = (evt: Event) => {
  if (props.disabled) return
  hoverSubmenu.value = false
  emits('mouseleave', evt)
}
</script>
