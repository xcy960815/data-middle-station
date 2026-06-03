<template>
  <div class="list-card" :title="titleAttr" @click="emit('click')">
    <div class="list-card__inset">
      <div class="list-card__content">
        <div class="list-card__title">{{ title }}</div>
        <div v-if="description" class="list-card__desc">{{ description }}</div>
      </div>

      <div class="list-card__actions">
        <slot name="actions"></slot>
      </div>

      <div class="list-card__badges">
        <div class="list-card__badge-group list-card__badge-group--left">
          <slot name="left-badges"></slot>
        </div>
        <div class="list-card__badge-group list-card__badge-group--right">
          <slot name="right-badges"></slot>
        </div>
      </div>

      <div class="list-card__info">
        <div class="list-card__info-row">
          <span class="list-card__creator">{{ creator || '未知' }}</span>
          <span class="list-card__time">{{ time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  titleAttr: {
    type: String,
    default: ''
  },
  creator: {
    type: String,
    default: ''
  },
  time: {
    type: String,
    default: ''
  }
})

const emit = defineEmits<{
  click: []
}>()
</script>

<style scoped lang="scss">
.list-card {
  position: relative;
  z-index: 1;
  height: 180px;
  width: 245px;
  cursor: pointer;
  overflow: hidden;
  border-radius: 12px;
  background: #f7f8fa;
  box-shadow:
    0 2px 12px 0 rgba(0, 0, 0, 0.08),
    0 1.5px 6px 0 rgba(0, 0, 0, 0.04);
  font-family: 'Microsoft YaHei';
  transition:
    transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.18s;

  &:hover {
    transform: translateY(-4px) scale(1.03);
    box-shadow:
      0 6px 24px 0 rgba(0, 0, 0, 0.13),
      0 2px 8px 0 rgba(0, 0, 0, 0.08);

    .list-card__actions {
      display: flex;
    }
  }
}

.list-card__inset {
  position: absolute;
  inset: 2px;
  z-index: 3;
  height: calc(100% - 4px);
  border-radius: inherit;
  background: #ffffff;
}

.list-card__content {
  position: absolute;
  top: 18px;
  right: 16px;
  bottom: 70px;
  left: 16px;
  display: flex;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.list-card__title {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  color: #222222;
  font-size: 18px;
  font-weight: bold;
  line-height: 1.4;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.list-card__desc {
  display: -webkit-box;
  max-width: 100%;
  margin-top: 8px;
  overflow: hidden;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.list-card__actions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: none;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.list-card__badges {
  position: absolute;
  right: 12px;
  bottom: 40px;
  left: 12px;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.list-card__badge-group {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.list-card__badge-group--right {
  justify-content: flex-end;
}

.list-card__info {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 8px 16px;
  border-radius: 0 0 12px 12px;
  background: rgba(245, 245, 245, 0.85);
  color: #444444;
  font-size: 13px;
  backdrop-filter: blur(2px);
}

.list-card__info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 1.8;
}

.list-card__creator {
  color: #666666;
}

.list-card__time {
  color: #999999;
  font-size: 12px;
}
</style>
