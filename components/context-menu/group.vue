<template>
  <li class="contextmenu-group">
    <div class="contextmenu-group__title">
      {{ title ? title : $slots.title ? $slots.title() : null }}
    </div>
    <ul :style="style" class="contextmenu-group__menus">
      <slot></slot>
    </ul>
  </li>
</template>

<script lang="ts" setup>
import type { CSSProperties } from 'vue';
const props = defineProps({
  title: {
    type: String,
    default: undefined,
  },
  maxWidth: {
    type: [Number, String],
    default: undefined,
  },
});

const style = computed<CSSProperties>(() => {
  if (!props.maxWidth) return {};
  return {
    'max-width': typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth,
    'overflow-x': 'auto',
  };
});
</script>
