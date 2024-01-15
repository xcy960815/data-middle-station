<template>
    <div class="homepage-content">
       <ChartCard v-for="chart in chartsList" :name="chart.name" :id="chart.id" :key="chart.id"></ChartCard>
    </div>
</template>

<script lang="ts" setup>
import ChartCard  from "./components/chart-card/index.vue"
import { initData } from './init-data'
import { handler } from "./handler"
const {chartsList} = initData()
const {} = handler()
onMounted(async () => {
   
})
</script>

<style scoped lang="less">
.homepage-content {
    position: relative;
}
</style>
