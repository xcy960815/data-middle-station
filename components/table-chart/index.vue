<template>
  <table class="table-chart">
    <thead>
      <tr>
        <th v-for="tableHeaderOption in tableHeaderState.tableHeader"
          @click="handleEmitOrder(tableHeaderOption.displayName || tableHeaderOption.alias || tableHeaderOption.columnName)">
          <span>{{ tableHeaderOption.displayName || tableHeaderOption.alias || tableHeaderOption.columnName }}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(tableDataOption, index) in tableDataState.tableData">
        <td v-for="(tableHeaderOption) in tableHeaderState.tableHeader"
          :style="tdStyle(tableDataOption, tableHeaderOption)"
          :class="getComparedClass(tableDataOption, tableHeaderOption)"
          v-html="getTableRenderItem(tableDataOption, tableHeaderOption, index)">
        </td>
      </tr>
    </tbody>
  </table>
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

const { total, pageNum, pageSize, tableHeaderState, tableDataState, tableChartConfig } = tableChartInitData(props);

const { handleEmitOrder,getComparedClass,getTableRenderItem } = tableChartHandler({ pageSize, pageNum, props, tableHeaderState, tableDataState, tableChartConfig });


/**
 * @desc tbody中的td的样式
 * @param tableDataOption {Chart.ChartData} 表格数据
 * @param tableHeaderOption {TableChart.TableHeaderOption} 表头数据
 * @returns {CSSStyleDeclaration}
 */
const tdStyle = (tableDataOption: Chart.ChartData, tableHeaderOption: TableChart.TableHeaderOption) => {
  return {
    // background:  '#f2f2f2' || '#fff',
  }
}

</script>

<style scoped lang="less">
.table-chart {
  position: relative;
  width: 100%;
  background: #ccc;
  margin: 10px auto;
  border-collapse: collapse;

  table-layout: fixed;

  thead th {
    border-bottom: 1px solid #ddd;
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
}</style>
