<template>
  <i :class="['contextmenu-icon', `${'contextmenu-icon'}-${name}`]" />
</template>

<script lang="ts" setup>
const props = defineProps({
  name: {
    type: String,
    default: () => '',
    required: true
  }
})
</script>

<style scoped lang="scss"></style>
