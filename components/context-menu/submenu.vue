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
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['mouseenter', 'mouseleave']);
/**
 * @desc titile的class
 */
const titleClasses = computed(() => ({
  ['contextmenu-item']: true,
  ['contextmenu-submenu__title']: true,
  ['contextmenu-item--hover']: hoverSubmenu.value,
  ['contextmenu-item--disabled']: props.disabled,
}));
/**
 * @desc 子菜单的class
 */
const subMenusClasses = computed(() => ({
  ['contextmenu']: true,
  ['contextmenu-submenu__menus']: true,
  ['contextmenu-submenu__menus--top']: placements.value.includes('top'),
  ['contextmenu-submenu__menus--right']: placements.value.includes('right'),
  ['contextmenu-submenu__menus--bottom']: placements.value.includes('bottom'),
  ['contextmenu-submenu__menus--left']: placements.value.includes('left'),
}));
const submenuElement = ref<HTMLDivElement | null>(null);
/**
 * @desc 是否自动调整子菜单的位置
 */
const autoAjustPlacement = inject<boolean>('autoAjustPlacement');
/**
 * @desc 子菜单的展示位置
 */
const placements = ref(['top', 'right']);
/**
 * @desc 是否hover
 */
const hoverSubmenu = ref(false);
/**
 * @desc 鼠标进入事件
 * @param evt { Event }
 * @returns { void }
 */
const handleMouseenter = (evt: Event) => {
  if (props.disabled) return;
  hoverSubmenu.value = true;
  emits('mouseenter', evt);

  nextTick(() => {
    const targetPlacements = [];
    // 计算子菜单的位置
    if (autoAjustPlacement) {
      const { target } = evt;
      const targetElementStyle = (target as HTMLElement).getBoundingClientRect();
      if (!submenuElement.value) return;
      const submenuWidth = submenuElement.value.clientWidth;
      const submenuHeight = submenuElement.value.clientHeight;
      if (targetElementStyle.right + submenuWidth >= window.innerWidth) {
        // 如果子菜单的右边超出了窗口的宽度，就放在左边
        targetPlacements.push('left');
      } else {
        // 否则就放在右边
        targetPlacements.push('right');
      }
      if (targetElementStyle.bottom + submenuHeight >= window.innerHeight) {
        // 如果子菜单的底部超出了窗口的高度，就放在上边
        targetPlacements.push('bottom');
      } else {
        // 否则就放在下边
        targetPlacements.push('top');
      }
    }

    placements.value = targetPlacements;
  });
};
/**
 * @desc 鼠标离开事件
 * @param evt { Event }
 * @returns { void }
 */
const handleMouseleave = (evt: Event) => {
  if (props.disabled) return;
  hoverSubmenu.value = false;
  emits('mouseleave', evt);
};
</script>
