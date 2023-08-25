<template>
  <!--  v-sticky="{ top, parent }" -->
  <ClientOnly>
    <!-- v-if="renderTable" -->
    <el-table
      size="small"
      class="table-chart"
      :data="tableData"
      :header-cell-style="{
        background: 'rgb(240, 240, 240)'
      }"
      style="width: 100%"
      highlight-current-row
      border
      stripe
      :cell-style="cellStyle"
      :span-method="spanMethod"
    >
      <el-table-column
        v-for="tableHeaderOption in tableHeader"
        show-overflow-tooltip
        :prop="tableHeaderOption.alias"
        :label="
          tableHeaderOption.displyName ||
          tableHeaderOption.alias ||
          tableHeaderOption.name
        "
        :min-width="tableHeaderOption.minWidth"
        sortable
        :formatter="tableColumnFormatter"
      >
      </el-table-column>
    </el-table>
    <!--  v-if="renderPagination" -->
    <el-pagination
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 30, 40]"
      size="small"
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
    />
  </ClientOnly>
</template>

<script lang="ts" setup type="module">
import { initData as tableChartInitData } from './init-data';
import { handler as tableChartHandler } from './handler';
const props = defineProps({
  data: {
    type: Array as PropType<Array<TableChartModule.TableDataItem>>,
    default: () => [],
  },
  xAxisFields: {
    type: Array as PropType<Array<TableChartModule.TableHeaderItem>>,
    default: () => [],
  },
  yAxisFields: {
    type: Array as PropType<Array<TableChartModule.TableHeaderItem>>,
    default: () => [],
  },
  autoWidth: {
    type: Boolean,
    default: () => false,
  },
  autoHeight: {
    type: Boolean,
    default: () => false,
  },
  top: {
    type: Number,
    default: () => 0,
  },
  parent: {
    type: String,
    default: () => null,
  },
});
const renderTable = computed<boolean>(()=>{
 return props.xAxisFields.concat(props.yAxisFields).length > 0;
})
const renderPagination = computed<boolean>(()=>{
 return props.xAxisFields.concat(props.yAxisFields).length > 0;
})
const { total, pageNum, pageSize, tableHeader, tableData } = tableChartInitData(props);

const { cellStyle, tableColumnFormatter, spanMethod } = tableChartHandler({});
</script>

<style scoped lang="less">
.table-chart {
  position: relative;
  // 修改表格样式 让其变得更加紧凑
  :deep(.el-table__header-wrapper) {
    .el-table__header {
      thead > tr > th {
        padding: 5px 0px;
      }
    }
    .el-table__header {
      thead > tr > th > div {
        padding: 0px 20px;
        font-size: 14px;
        font-weight: 500;
        font-family: 'Trebuchet MS', 'Lucida Sans Unicode',
          'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
      }
    }
  }
  // 修改表格样式 让其变得更加紧凑
  :deep(.el-table__body-wrapper) {
    .el-table__body {
      tbody > tr > td {
        padding: 0;
        font-size: 14px;
      }
      tbody > tr > td > div {
        padding: 5px 22px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
