<template>
  <li
    :class="classes"
    @click="handleClickItem"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <slot></slot>
  </li>
</template>

<script setup lang="ts">
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  hideOnClick: {
    type: Boolean,
    default: true,
  },
});
const emit = defineEmits(['click', 'mouseenter', 'mouseleave']);

const rootHide = inject<() => void>('hide');
/**
 * @desc 当前菜单项是否处于 hover 状态
 */
const hoverItem = ref(false);
/**
 * @desc 菜单项的样式
 */
const classes = computed(() => ({
  ['contextmenu-item']: true,
  ['contextmenu-item--disabled']: props.disabled,
  ['contextmenu-item--hover']: hoverItem.value,
}));

// 当用户点击菜单项时，触发 click 事件
const handleClickItem = (evt: Event) => {
  if (props.disabled) return;
  // 如果设置了 hideOnClick 为 true，则点击菜单项后，隐藏菜单
  props.hideOnClick && rootHide?.();

  emit('click', evt);
};
/**
 * @desc 鼠标进入菜单项时，触发 mouseenter 事件
 * @param {Event} evt
 */
const handleMouseEnter = (evt: Event) => {
  if (props.disabled) return;
  hoverItem.value = true;
  emit('mouseenter', evt);
};
/**
 * @desc 鼠标离开菜单项时，触发 mouseleave 事件
 * @param {Event} evt
 */
const handleMouseLeave = (evt: Event) => {
  if (props.disabled) return;
  hoverItem.value = false;
  emit('mouseleave', evt);
};
</script>

<style scoped lang="less"></style>
