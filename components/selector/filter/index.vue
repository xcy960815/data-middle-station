<template>
  <div class="filter-selector">
    <selector-template v-bind="$attrs" :index="props.index">
      <template #filter-suffix>
        <slot name="filter-suffix"></slot>
      </template>
      <template #default="{ closePopover }">
        <slot :close-popover="closePopover"></slot>
      </template>
    </selector-template>
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  index: {
    type: Number,
    default: null
  },
  filter: {
    type: Object as PropType<FilterStore.FilterOption>,
    required: true,
    default: () => ({})
  }
})
</script>

<style lang="scss" scoped>
.filter-selector {
  width: 100%;
}
</style>
