<template>
    <div class="homepage-container relative" ref="container">
        <ChartCard ref="cards" class="card" v-for="chart in chartsList" :create-time="chart.createTime"
            :chart-name="chart.chartName" :id="chart.id" :key="chart.id" :visits="chart.visits">
        </ChartCard>
    </div>
</template>

<script lang="ts" setup>
import ChartCard from "./components/chart-card/index.vue"
import { initData } from './init-data'
import { handler } from "./handler"
const { chartsList, container } = initData()
const { } = handler({ container })
</script>

<style scoped lang="scss">
.homepage-container {
    @include useTheme {
        background-color: getVar('bgColor');
    }
    display: flex;
    flex-wrap: wrap;
    .card {
        margin: 1rem;
    }
}
</style>
