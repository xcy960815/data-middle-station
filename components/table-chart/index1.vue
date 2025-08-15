<template>
  <div class="table-chart h-full">
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th
              v-for="header in tableHeaderState.tableHeader"
              :key="header.columnName"
              class="table-header-item"
              @click="handleEmitOrder(header)"
            >
              <span :class="getTableHeaderClass(header)">
                {{ header.displayName || header.columnName }}
              </span>
              <!-- <icon-park
                class="mx-1"
                type="sort-amount-down"
                size="12"
                fill="#333"
              ></icon-park> -->
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in paginatedData" :key="index">
            <td
              v-for="header in tableHeaderState.tableHeader"
              :key="header.columnName"
              :style="getComparedStyle(row, header)"
              :class="getComparedClass(row, header)"
              v-html="getComparedContent(row, header, index)"
            ></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <span class="pagination-info"> 第{{ startIndex }}-{{ endIndex }}条，共{{ totalPage }}页{{ total }}条 </span>
      <div class="pagination-controls">
        <el-icon :size="12" class="cursor-pointer" @click="handlePreviousPage(1)">
          <DArrowLeft />
        </el-icon>
        <el-icon :size="12" class="cursor-pointer" @click="handlePreviousPage">
          <ArrowLeft />
        </el-icon>
        <input
          class="page-input"
          type="number"
          v-model.number="pageNum"
          min="1"
          :max="totalPage"
          @change="handlePageChange"
        />
        <el-icon :size="12" class="cursor-pointer" @click="handleNextPage">
          <ArrowRight />
        </el-icon>
        <el-icon :size="12" class="cursor-pointer" @click="handleNextPage(totalPage)">
          <DArrowRight />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps({
  data: {
    type: Array as PropType<ChartDataDao.ChartData>,
    default: () => []
  },
  xAxisFields: {
    type: Array as PropType<Array<GroupStore.GroupOption>>,
    default: () => []
  },
  yAxisFields: {
    type: Array as PropType<Array<DimensionStore.DimensionOption>>,
    default: () => []
  },
  chartHeight: {
    type: Number,
    default: () => 0
  },
  chartWidth: {
    type: Number,
    default: () => 0
  }
})
/**
 * @desc 表格高度
 */
const TABLEHEADERHEIGHT = 25

/**
 * @desc 分页高度
 */
const PAGINATIONHEIGHT = 25

/**
 * @desc 行高
 */
const ROWHEIGHT = 25

/**
 * @desc 当前页码
 */
const pageNum = ref(1)

/**
 * @desc 每页条数
 */
const pageSize = ref(0)

/**
 * @desc 订单 store
 */
const orderStore = useOrderStore()

/**
 * @desc 图表配置 store
 */
const chartsConfigStore = useChartConfigStore()

/**
 * @desc 表格头状态
 */
const tableHeaderState = reactive<TableChart.TableHeaderState>({
  tableHeader: []
})

/**
 * @desc 表格数据状态
 */
const tableDataState = reactive<TableChart.TableDataState>({
  tableData: []
})

// 计算属性
/**
 * @desc 总条数
 */
const total = computed(() => props.data.length)

/**
 * @desc 开始索引
 */
const startIndex = computed(() => (pageNum.value - 1) * pageSize.value + 1)

/**
 * @desc 结束索引
 */
const endIndex = computed(() => Math.min(pageNum.value * pageSize.value, total.value))

/**
 * @desc 总页数
 */
const totalPage = computed(() => Math.ceil(total.value / pageSize.value))

/**
 * @desc 分页数据
 */
const paginatedData = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableDataState.tableData.slice(start, end)
})

/**
 * @desc 表格配置
 */
const tableChartConfig = computed(() => chartsConfigStore.chartConfig?.table)

// 方法
/**
 * @desc 获取表格头类
 */
const getTableHeaderClass = computed(() => (item: TableChart.TableHeaderOption) => {
  return ['table-header-content', item.orderType === 'desc' ? 'icon-desc' : item.orderType === 'asc' ? 'icon-asc' : '']
})

/**
 * @desc 获取表格中的字段的样式
 * @param tableDataOption {Chart.ChartData} 表格数据
 * @param tableHeaderOption {TableChart.TableHeaderOption} 表头数据
 * @returns {string}
 */
const getComparedClass = (
  tableDataOption: ChartDataDao.ChartData[number],
  tableHeaderOption: TableChart.TableHeaderOption
) => {
  return ''
}

/**
 * @desc 处理排序
 */
const handleEmitOrder = (tableHeaderOption: TableChart.TableHeaderOption) => {
  const orderTypes = ['asc', 'desc', null] as OrderStore.OrderType[]
  const currentIndex = orderTypes.indexOf(tableHeaderOption.orderType)
  tableHeaderOption.orderType = orderTypes[(currentIndex + 1) % 3]

  const order = orderStore.getOrders.find((o) => o.columnName === tableHeaderOption.columnName)
  const orderIndex = orderStore.getOrders.findIndex((o) => o.columnName === tableHeaderOption.columnName)

  if (order && !tableHeaderOption.orderType) {
    orderStore.removeOrder(orderIndex)
  } else if (order && tableHeaderOption.orderType) {
    order.orderType = tableHeaderOption.orderType
    orderStore.updateOrder({ order, index: orderIndex })
  } else if (!order && tableHeaderOption.orderType) {
    orderStore.addOrders([
      {
        ...tableHeaderOption,
        orderType: tableHeaderOption.orderType,
        aggregationType: 'raw'
      }
    ])
  }
}

/**
 * @desc 获取比较样式
 */
const getComparedStyle = (
  tableDataOption: ChartDataDao.ChartData[number],
  tableHeaderOption: TableChart.TableHeaderOption
): string => {
  const conditions = chartsConfigStore.getChartConfig?.table?.conditions
  if (!conditions) return ''

  const condition = conditions.find((c) => c.conditionField === tableHeaderOption.columnName)
  if (!condition) return ''

  const { conditionType, conditionSymbol, conditionValue, conditionColor, conditionMinValue, conditionMaxValue } =
    condition

  const keyForValue = (tableHeaderOption.displayName || tableHeaderOption.columnName || '') as string
  const currentValue = Number(tableDataOption[keyForValue] ?? 0)

  if (conditionType === '单色') {
    type ConditionSymbol = 'gt' | 'lt' | 'eq' | 'ne' | 'ge' | 'le' | 'between'
    const conditions: Record<ConditionSymbol, () => boolean> = {
      gt: () => currentValue > Number(conditionValue || 0),
      lt: () => currentValue < Number(conditionValue || 0),
      eq: () => currentValue === Number(conditionValue),
      ne: () => currentValue !== Number(conditionValue),
      ge: () => currentValue >= Number(conditionValue || 0),
      le: () => currentValue <= Number(conditionValue || 0),
      between: () => currentValue >= Number(conditionMinValue || 0) && currentValue <= Number(conditionMaxValue || 0)
    }

    return conditions[conditionSymbol as ConditionSymbol]?.() ? `color: ${conditionColor}` : ''
  }

  if (conditionType === '色阶') {
    const keyForRow = (tableHeaderOption.displayName || tableHeaderOption.columnName || '') as string
    const currentRowValueList = props.data.map((t) => Number(t[keyForRow] ?? 0))
    const maxValue = Math.max(...currentRowValueList)
    const minValue = Math.min(...currentRowValueList)
    const valueDif = maxValue - minValue

    if (valueDif === 0) return ''

    const [r, g, b] = conditionColor
      .replace(/rgb\(|\)/g, '')
      .split(',')
      .map(Number) as [number, number, number]
    const R = 256 - (256 - r) * ((currentValue - minValue) / valueDif)
    const G = 256 - (256 - g) * ((currentValue - minValue) / valueDif)
    const B = 256 - (256 - b) * ((currentValue - minValue) / valueDif)

    return `background-color: rgb(${R},${G},${B})`
  }

  return ''
}

/**
 * @desc 获取比较内容
 */
const getComparedContent = (
  tableDataOption: ChartDataDao.ChartData[number],
  tableHeaderOption: TableChart.TableHeaderOption,
  index: number
): string => {
  const key = (tableHeaderOption.displayName || tableHeaderOption.columnName || '') as string
  return key && tableDataOption[key] != null ? String(tableDataOption[key]) : ''
}

/**
 * @desc 处理页码变化
 */
const handlePageChange = () => {
  if (pageNum.value < 1) pageNum.value = 1
  if (pageNum.value > totalPage.value) pageNum.value = totalPage.value
}

/**
 * @desc 处理上一页
 */
const handlePreviousPage = (page?: number) => {
  if (page === 1) {
    pageNum.value = 1
  } else {
    pageNum.value = Math.max(1, pageNum.value - 1)
  }
}

/**
 * @desc 处理下一页
 */
const handleNextPage = (page?: number) => {
  if (page && page === totalPage.value) {
    pageNum.value = page
  } else {
    pageNum.value = Math.min(totalPage.value, pageNum.value + 1)
  }
}

/**
 * @desc 计算每页条数
 */
const calculatePageSize = () => {
  const availableHeight = props.chartHeight - TABLEHEADERHEIGHT - PAGINATIONHEIGHT - 10
  pageSize.value = Math.floor(availableHeight / ROWHEIGHT)
}

/**
 * @desc 初始化表格头
 */
const initTableHeader = () => {
  const fields = [...props.xAxisFields, ...props.yAxisFields]
  tableHeaderState.tableHeader = fields.map((field) => {
    const currentOrder = orderStore.getOrders.find((o) => o.columnName === field.columnName)
    return {
      ...field,
      orderType: currentOrder?.orderType || 'asc',
      aggregationType: currentOrder?.aggregationType || 'raw'
    }
  })
}

/**
 * @desc 初始化表格数据
 */
const initTableData = () => {
  tableDataState.tableData = props.data
}

// 监听器
/**
 * @desc 监听表格配置
 */
watch(
  () => tableChartConfig.value?.conditions,
  () => {
    calculatePageSize()
  },
  { deep: true }
)

/**
 * @desc 监听数据
 */
watch(
  () => props.data,
  async () => {
    await initTableHeader()
    await initTableData()
    calculatePageSize()
  },
  { deep: true }
)

/**
 * @desc 监听表格高度
 */
watch(
  () => props.chartHeight,
  () => {
    calculatePageSize()
  }
)

/**
 * @desc 初始化
 */
onMounted(async () => {
  await initTableHeader()
  await initTableData()
  calculatePageSize()
})
</script>

<style scoped lang="scss">
.table-chart {
  display: flex;
  flex-direction: column;
  height: 100%;

  .table-container {
    flex: 1;
    overflow: auto;

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      background: #fff;

      thead {
        position: sticky;
        top: 0;
        z-index: 1;

        tr th {
          background: #f5f7fa;
          border-bottom: 1px solid #e4e7ed;
          font-weight: 500;
          text-align: left;
          height: v-bind('TABLEHEADERHEIGHT + "px"');
          line-height: v-bind('TABLEHEADERHEIGHT + "px"');
          font-size: 13px;
          color: #606266;
          padding: 0 12px;
          transition: background-color 0.2s;

          &:hover {
            background-color: #ebeef5;
          }

          .table-header-content {
            position: relative;
            display: flex;
            align-items: center;
            gap: 4px;

            &::after {
              content: '';
              position: absolute;
              right: 0px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 16px;
              line-height: 1;
            }
          }

          .icon-asc::after {
            content: '\25B4';
          }

          .icon-desc::after {
            content: '\25BE';
          }
        }
      }

      tbody {
        tr {
          height: v-bind('ROWHEIGHT + "px"');
          line-height: v-bind('ROWHEIGHT + "px"');
          font-size: 13px;
          color: #606266;
          transition: background-color 0.2s;

          &:nth-child(even) {
            background-color: #fafafa;
          }

          &:hover {
            background-color: #f5f7fa;
          }

          td {
            padding: 0 12px;
            border-bottom: 1px solid #ebeef5;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 8px 0;
    font-size: 13px;
    color: #606266;

    .pagination-info {
      margin-right: 16px;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        cursor: pointer;
        color: #606266;
        transition: color 0.2s;

        &:hover {
          color: #409eff;
        }
      }

      .page-input {
        width: 40px;
        height: 24px;
        text-align: center;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        color: #606266;
        transition: all 0.2s;

        &:focus {
          border-color: #409eff;
          outline: none;
        }

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      }
    }
  }
}
</style>
