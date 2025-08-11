<!-- 数据库表选择器 -->
<template>
  <client-only>
    <el-popover
      placement="bottom-start"
      :width="800"
      trigger="click"
      popper-class="table-select-popover"
      v-model:visible="isPopoverVisible"
    >
      <template #reference>
        <div class="select-trigger" :class="{ 'is-active': isPopoverVisible }">
          <span class="selected-value">{{ dataSource || '请选择数据库表' }}</span>
          <icon-park
            v-if="dataSource"
            class="clear-icon"
            type="CloseOne"
            @click.stop="clearDataSource"
            style="margin-left: 8px; cursor: pointer"
          >
          </icon-park>
        </div>
      </template>

      <div class="search-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索表名/备注"
          clearable
          :prefix-icon="Search"
          style="margin-bottom: 8px; width: 220px"
        />
        <el-button type="primary" style="margin-left: 8px; margin-bottom: 8px" @click="handleSearchTable"
          >搜索</el-button
        >
      </div>

      <el-table
        :data="dataSourceOptions"
        border
        style="width: 100%"
        @row-click="handleSelectedTable"
        highlight-current-row
        max-height="300"
        :row-class-name="rowClassName"
        empty-text="暂无数据"
      >
        <el-table-column prop="tableName" label="表名" min-width="120" />
        <el-table-column prop="tableComment" label="备注" min-width="120" />
      </el-table>
    </el-popover>
  </client-only>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElPopover, ElTable, ElTableColumn, ElInput, ElButton, ElMessage } from 'element-plus'
import { IconPark } from '@icon-park/vue-next/es/all'
/**
 * @desc 列存储
 */
const columnStore = useColumnStore()
const searchKeyword = ref('')
/**
 * @desc 是否显示弹窗
 * @returns {boolean}
 */
const isPopoverVisible = ref(false)
/**
 * @desc 事件
 * @returns {void}
 */
const emit = defineEmits(['dataSource-change'])
/**
 * @desc 数据源
 * @returns {string}
 */
const dataSource = computed({
  get: () => {
    return columnStore.getDataSource
  },
  set: (val) => {
    columnStore.setDataSource(val)
  }
})

/**
 * @desc 数据源选项
 * @returns {ColumnStore.dataSourceOption[]}
 */
const dataSourceOptions = computed(() => columnStore.getDataSourceOptions)

/**
 * @desc 搜索按钮点击（目前只做UI，实际过滤仍为输入框实时过滤）
 */
const handleSearchTable = () => {
  queryTable()
}

/**
 * @desc 选择表
 * @param {ColumnStore.DataSourceOption} row 表数据
 * @returns {void}
 */
const handleSelectedTable = (row: ColumnStore.DataSourceOption) => {
  dataSource.value = row.tableName
  isPopoverVisible.value = false
  if (row.tableName) emit('dataSource-change', row.tableName)
}

/**
 * @desc 高亮当前选中行
 * @param {DatabaseVo.TableOption} row 表数据
 * @returns {string}
 */
const rowClassName = ({ row }: { row: DatabaseVo.TableOption }) => {
  return row.tableName === dataSource.value ? 'is-selected' : ''
}

/**
 * @desc 查询表格列表
 * @returns {Promise<void>}
 */
const queryTable = async () => {
  const result = await $fetch('/api/queryTable', {
    method: 'GET',
    params: {
      tableName: searchKeyword.value
    }
  })
  if (result.code === 200) {
    columnStore.setDataSourceOptions(result.data || [])
  } else {
    ElMessage.error(result.message || '获取表列表失败')
    columnStore.setDataSourceOptions([])
  }
}

/**
 * @desc 清空数据源
 * @returns {void}
 */
const clearDataSource = () => {
  dataSource.value = ''
}

watch(
  () => isPopoverVisible.value,
  (visible) => {
    if (visible) {
      queryTable()
    }
  }
)
</script>

<style lang="scss" scoped>
.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  border: 1.5px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.03);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:hover,
  &.is-active {
    border-color: #409eff;
    box-shadow: 0 2px 8px 0 rgba(64, 158, 255, 0.08);
  }

  .selected-value {
    color: #303133;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trigger-icon {
    color: #bfcbd9;
    font-size: 18px;
    margin-left: 8px;
    transition: transform 0.3s;
  }

  &.is-active .trigger-icon {
    transform: rotate(180deg);
  }
}

.search-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

:deep(.table-select-popover) {
  border-radius: 10px;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.1);
  padding: 12px 0 0 0;
}

:deep(.el-table) {
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
}

:deep(.el-table th) {
  background: #f7fafd;
  color: #606266;
  font-weight: 500;
  border-bottom: none;
}

:deep(.el-table__row) {
  transition: background 0.2s;

  &.is-selected {
    background: #e6f7ff !important;
  }

  &:hover {
    background: #f5f7fa !important;
  }
}

:deep(.el-table td) {
  border-bottom: none;
}

:deep(.el-table__empty-block) {
  background: #fff;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

.clear-icon {
  color: #bfcbd9;
  font-size: 16px;
  transition: color 0.2s;

  &:hover {
    color: #409eff;
  }
}
</style>
