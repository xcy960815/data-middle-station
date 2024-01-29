<template>
    <div class="homepage-container" ref="container">
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
    background-color: #555;
    position: relative;
    padding: 1rem;
    display: grid;
    grid-gap: 20px;
    grid-template-columns: repeat(12, minmax(250px, 1fr));
    /* 使用auto-fit和minmax()函数 */
    .card {
        aspect-ratio: 4 / 3;
    }
}
</style>
