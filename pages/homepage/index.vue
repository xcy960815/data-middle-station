<template></template>

<script setup lang="ts">
definePageMeta({
  middleware: [
    () => {
      return navigateTo('/analyze', { replace: true })
    }
  ]
})
</script>
