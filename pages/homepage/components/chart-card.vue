<template>
  <div
    class="card-item relative w-[245px] h-[180px] cursor-pointer"
    @click="handleClickCard"
    :title="'访问次数' + viewCount"
  >
    <div class="card-inset">
      <div class="card-title">{{ analyseName }}</div>
      <div class="card-type-middle">{{ chartType }}</div>
      <div class="card-info">
        <div class="info-row">
          <span class="creator">{{ createdBy || '未知' }}</span>
          <span class="create-time">{{ createTime ? createTime.split('T')[0] : '' }}</span>
        </div>
        <!-- <div class="info-row">
          <span class="update-time">{{ updateTime ? updateTime.split('T')[0] : '' }}</span>
        </div> -->
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
    default: '',
  },
  analyseName: {
    type: String,
    required: true,
    default: '',
  },
  viewCount: {
    type: Number,
    required: true,
    default: 0,
  },
  chartType: {
    type: String,
    required: true,
    default: '',
  },
  createdBy: {
    type: String,
    default: '',
  },
  updatedBy: {
    type: String,
    default: '',
  },
  createTime: {
    type: String,
    default: '',
  },
  updateTime: {
    type: String,
    default: '',
  },
})
/**
 * @desc 点击卡片跳转到对应的分析页面
 */
const handleClickCard = () => {
  router.push({
    path: '/analyse',
    query: {
      id: props.id,
    },
  })
}
</script>

<style lang="scss" scoped>
.card-item {
  overflow: hidden;
  font-family: 'Microsoft YaHei';
  border-radius: 12px;
  box-shadow:
    0 2px 12px 0 rgba(0, 0, 0, 0.08),
    0 1.5px 6px 0 rgba(0, 0, 0, 0.04);
  background: #f7f8fa;
  transition:
    transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.18s;
  position: relative;
  z-index: 1;

  &:hover {
    transform: translateY(-4px) scale(1.03);
    box-shadow:
      0 6px 24px 0 rgba(0, 0, 0, 0.13),
      0 2px 8px 0 rgba(0, 0, 0, 0.08);
    cursor: pointer;
  }

  .card-inset {
    position: absolute;
    inset: 2px;
    background: #fff;
    border-radius: inherit;
    z-index: 3;
    display: flex;
    flex-direction: column;
    height: calc(100% - 4px);
    justify-content: space-between;
  }

  .card-title {
    margin-top: 24px;
    font-size: 18px;
    font-weight: bold;
    color: #222;
    padding: 0 16px;
    line-height: 1.4;
    word-break: break-all;
  }

  .card-type-middle {
    margin: 12px 16px 0 16px;
    font-size: 15px;
    color: #409eff;
    font-weight: 500;
    text-align: left;
    word-break: break-all;
  }

  .card-info {
    padding: 8px 16px 8px 16px;
    position: absolute;
    bottom: 0;
    width: 100%;
    background: rgba(245, 245, 245, 0.85);
    font-size: 13px;
    color: #444;
    border-radius: 0 0 12px 12px;
    backdrop-filter: blur(2px);

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 1.8;
    }
    .creator {
      color: #666;
    }
    .create-time,
    .update-time {
      color: #999;
      font-size: 12px;
    }
  }
}
</style>
