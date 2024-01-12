<template>
    <div class="homepage-content">
        homepage content
        你好，{{ initData.name }}
    </div>
</template>

<script lang="ts" setup>
import { initData } from './init-data'
import { handler } from "./handler"
</script>

<style scoped lang="less">
.homepage-content {
    position: relative;
}
</style>
