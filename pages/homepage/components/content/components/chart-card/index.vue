<template>
    <div class="chart-card" @click="handleClickCard">
        <span>{{ name }}</span>
        <span>{{ visits }}</span>
    </div>
</template>

<script setup lang="ts">
const router = useRouter()
const props = defineProps({
    id: {
        type: Number,
        required: true,
        default: ''
    },
    name: {
        type: String,
        required: true,
        default: ''
    },
    visits: {
        type: Number,
        required: true,
        default: 0
    }
})
/**
 * @desc 点击卡片跳转到对应的分析页面
 */
const handleClickCard = () => {

    router.push({
        path: '/analyse',
        query: {
            id: props.id
        }
    })
}
</script>

<style scoped lang="less">
.chart-card {
    position: relative;
    background-color: #fff;
    border: 1px solid #ddd;
    overflow: hidden;
    width: 245px;
    height: 245px;
    padding: 4px;
    margin: auto;
}
</style>
