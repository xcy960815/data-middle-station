<template>
  <div class="table-chart h-full">
    <!-- 普通表格 -->
    <table>
      <thead>
        <tr>
          <th v-for="tableHeaderOption in tableHeaderState.tableHeader" class="cursor-pointer"
            @click="handleEmitOrder(tableHeaderOption)">
            <span class="table-header-item"
              :class="tableHeaderOption.orderType == 'desc' ? 'icon-desc' : tableHeaderOption.orderType == 'asc' ? 'icon-asc' : ''">
              {{ tableHeaderOption.displayName || tableHeaderOption.alias || tableHeaderOption.columnName }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(tableDataOption, index) in tableDataState.tableData">
          <td v-for="(tableHeaderOption) in tableHeaderState.tableHeader"
            :style="getComparedStyle(tableDataOption, tableHeaderOption)"
            :class="getComparedClass(tableDataOption, tableHeaderOption)"
            v-html="getComparedContent(tableDataOption, tableHeaderOption, index)">
          </td>
        </tr>
      </tbody>
    </table>
    <!-- 分页器 -->
    <div class="pagination">
      <span class="information-container">第{{ startIndex }}-{{ endIndex }}条</span>
      <span class="information2-container">共{{ totalPage }}页{{ total }}条</span>
      <!-- 回到第一页 -->
      <el-icon :size="12">
        <DArrowLeft />
      </el-icon>
      <!-- 上一页 -->
      <el-icon :size="12">
        <ArrowLeft />
      </el-icon>
      <!-- <input class="pageInput" type="number" @change="changePageNum" :value="Number(pageNum) + 1" min="1"
      :max="Math.ceil(rawTableData.length / rowCountPerPage)" /> -->
      <!-- 下一页 -->
      <el-icon :size="12">
        <ArrowRight />
      </el-icon>
      <!-- 最后一页 -->
      <el-icon :size="12">
        <DArrowRight />
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
  autoWidth: {
    type: Boolean,
    default: () => true,
  },
});

const { startIndex, totalPage, endIndex, total, pageNum, pageSize, tableHeaderState, tableDataState, tableChartConfig } = tableChartInitData(props);

const { handleEmitOrder, getComparedClass, getComparedContent, getComparedStyle } = tableChartHandler({ pageSize, pageNum, props, tableHeaderState, tableDataState, tableChartConfig });


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

    thead th {
      border-bottom: 1px solid #ddd;

      .table-header-item {
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

    tbody td {
      border: 1px solid #ddd;
    }

    th,
    td {
      height: 25px;
      line-height: 25px;
      text-align: left;
      font-size: 12px;
      color: #727479;
      padding: 0 10px;
    }

    th {
      background: #eee;
      font-weight: normal;
    }

    tr {
      background: #fff;
    }

    tr:nth-child(odd) {
      background-color: #ffffff;
    }

    tr:nth-child(even) {
      background-color: #f2f2f2;
    }

    tr:hover {
      background-color: #e2e2e2;
    }
  }

  // 分页样式
  .pagination {
    text-align: right;
    font-size: 12px;
  }
}
</style>
