<template>
    <div class="card" @click="handleClickCard" :title="'访问次数' + visits">
        <div class="card-inset">
            <div class="card-title">{{ chartName }}</div>
            <div class="create-info">
                <span class="creator">徐崇玉</span>
                <span class="create-time">{{createTime}}</span>
            </div>
        </div>
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
    chartName: {
        type: String,
        required: true,
        default: ''
    },
    visits: {
        type: Number,
        required: true,
        default: 0
    },
    createTime: {
        type: String,
        required: true,
        default: ''
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

<style scoped lang="scss">
.card {
    position: relative;
    overflow: hidden;
    width: 245px;
    height: 180px;
    cursor: pointer;
    font-family: 'Microsoft YaHei';
    border-radius: 10px;
    z-index: 1;

    // 中间层
    &::before {
        z-index: 2;
        content: '';
        position: absolute;
        inset: 2px;
        border-radius: inherit;
        background: radial-gradient(closest-side circle,
                rgba(0, 0, 0, 0.6) 0%,
                rgba(0, 0, 0, 1));
        transform: translate(var(--x, -1000px), var(--y, -1000px));
    }

    // 最上层的展示层
    .card-inset {
        position: absolute;
        inset: 2px;
        background: #ccc;
        border-radius: inherit;
        z-index: 3;
    }

    // 标题
    .card-title {
        margin-top: 20px;
        font-size: 14px;
        padding: 0 10px;
    }


    // 创建信息
    .create-info {
        padding: 0 10px;
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 32px;
        background-color: #ccc;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 0 0 10px 10px;
    }
}
</style>
