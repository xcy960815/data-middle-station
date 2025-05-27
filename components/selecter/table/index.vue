<!-- 数据库表选择器 -->
<template>
  <client-only>
    <div class="table-selecter">
      <el-select
        v-model="dataSource"
        placeholder="请选择数据库表"
      >
        <el-option
          v-for="table in dataSourceOptions"
          :key="table.label"
          :label="table.label"
          :value="table.value"
        />
      </el-select>
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { ElSelect, ElOption } from 'element-plus'
import { useColumnStore } from '@/stores/analyse/column'

const columnStore = useColumnStore()

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
const dataSourceOptions = computed(
  () => columnStore.getDataSourceOptions
)
</script>
