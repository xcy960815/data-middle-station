<template>
  <div class="table-chart h-full">
    <!-- 普通表格 -->
    <table class="over">
      <thead>
        <tr>
          <th v-for="tableHeaderOption in tableHeaderState.tableHeader" class="cursor-pointer"
            @click="handleEmitOrder(tableHeaderOption)">
            <span :class="getTableHeaderClass(tableHeaderOption)">
              {{ tableHeaderOption.displayName || tableHeaderOption.alias || tableHeaderOption.columnName }}
            </span>
          </th>
        </tr>
      </thead>
      <!-- 因为要控制铺满一页，所以这里采用js动态渲染 -->
      <tbody>
        <!-- <tr v-for="(tableDataOption, index) in tableDataState.tableData">
          <td v-for="(tableHeaderOption) in tableHeaderState.tableHeader"
            :style="getComparedStyle(tableDataOption, tableHeaderOption)"
            :class="getComparedClass(tableDataOption, tableHeaderOption)"
            v-html="getComparedContent(tableDataOption, tableHeaderOption, index)">
          </td>
        </tr> -->
      </tbody>
    </table>



    <!-- 分页器 -->
    <div class="pagination">
      <span class="information-container">第{{ startIndex }}-{{ endIndex }}条</span>
      <span class="information2-container">共{{ totalPage }}页{{ total }}条</span>
      <!-- 回到第一页 -->
      <el-icon :size="12" class="cursor-pointer">
        <DArrowLeft @click="handlePreviousPage(1)" />
      </el-icon>
      <!-- 上一页 -->
      <el-icon :size="12" class="cursor-pointer">
        <ArrowLeft @click="handlePreviousPage" />
      </el-icon>
      <input class="page-input" type="number" :value="pageNum" min="1" :max="totalPage" />
      <!-- 下一页 -->
      <el-icon :size="12" class="cursor-pointer">
        <ArrowRight @click="handleNextPage" />
      </el-icon>
      <!-- 最后一页 -->
      <el-icon :size="12" class="cursor-pointer">
        <DArrowRight @click="handleNextPage(totalPage)" />
      </el-icon>
    </div>
  </div>
</template>

<script lang="ts" setup type="module">
import { initData as tableChartInitData } from './init-data';
import { handler as tableChartHandler } from './handler';

const props = defineProps({
  data: {
    type: Array as PropType<Array<Chart.ChartData>>,
    default: () => [],
  },
  xAxisFields: {
    type: Array as PropType<Array<Chart.XAxisFields>>,
    default: () => [],
  },
  yAxisFields: {
    type: Array as PropType<Array<Chart.YAxisFields>>,
    default: () => [],
  },
  chartHeight: {
    type: Number,
    default: () => 0,
  },
  chartWidth: {
    type: Number,
    default: () => 0,
  },
});

const {
  TABLEHEADERHEIGHT,
  PAGINATIONHEIGHT,
  startIndex,
  totalPage,
  endIndex,
  total,
  pageNum,
  pageSize,
  tableHeaderState,
  tableDataState,
  tableChartConfig,
  getTableHeaderClass
} = tableChartInitData(props);

const {
  handleEmitOrder,
  handlePreviousPage,
  handleNextPage
} = tableChartHandler({
  TABLEHEADERHEIGHT,
  PAGINATIONHEIGHT,
  pageSize,
  pageNum,
  totalPage,
  props,
  tableHeaderState,
  tableDataState,
  tableChartConfig
});

</script>

<style scoped lang="less">
.table-chart {

  // 表格样式
  table {
    position: relative;
    width: 100%;
    background: #ccc;
    margin: 10px auto;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 0;

    thead tr th {
      border-bottom: 1px solid #ddd;
      background: #eee;
      font-weight: normal;
      text-align: left;
      height: 25px;
      line-height: 25px;
      font-size: 12px;
      color: #727479;
      padding: 0 10px;

      .table-header-content {
        position: relative;
      }

      .icon-asc::after {
        height: inherit;
        position: absolute;
        top: -6px;
        content: '\00a0\25B4';
        font-size: 20px;
      }

      .icon-desc::after {
        height: inherit;
        position: absolute;
        top: -6px;
        content: '\00a0\25BE';
        font-size: 20px;
      }

    }


    tbody {
      height: 25px;
      line-height: 25px;
      font-size: 12px;
      color: #727479;
      padding: 0 10px;
    }

    :deep(tbody tr td) {
      border: 1px solid #ddd;
      height: 25px;
      line-height: 25px;
      font-size: 12px;
      color: #727479;
      padding: 0 10px;
    }

    :deep(tbody tr:nth-child(odd)) {
      background-color: #ffffff;
    }

    :deep(tbody tr:nth-child(even)) {
      background-color: #f2f2f2;
    }

    :deep(tbody tr:hover) {
      background-color: #e2e2e2;
    }
  }

  // 分页样式
  .pagination {
    margin-top: 5px;
    text-align: right;
    font-size: 12px;
    color: rgb(85, 85, 85);
    display: flex;
      align-items: center;
      justify-content: flex-end;
    .page-input {
      width: 35px;
      height: 20px;
      color: #666;
      text-align: center;
      border: 1px solid #888;
      border-radius: 3px;
     
    }
  }
}
</style>
