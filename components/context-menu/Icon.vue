<template>
  <i :class="iconClasses" />
</template>

<script lang="ts" setup>
const props = defineProps({
  name: {
    type: String,
    default: () => '',
    required: true
  }
})

const iconClasses = computed(() => ['contextmenu-icon', `contextmenu-icon-${props.name}`])
</script>

<style scoped lang="scss"></style>
