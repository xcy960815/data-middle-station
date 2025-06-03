<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #chart-name>
          <ChartName></ChartName>
        </template>
      </custom-header>
    </template>
    <template #cloumn>
      <Column></Column>
    </template>
    <template #filter>
      <Filter></Filter>
    </template>
    <template #order>
      <Order></Order>
    </template>
    <template #dimension>
      <DimensionOption></DimensionOption>
    </template>
    <template #group>
      <GroupOption></GroupOption>
    </template>
    <template #bar>
      <Bar></Bar>
    </template>
    <template #chart>
      <Chart></Chart>
    </template>
    <template #chart-type>
      <ChartType></ChartType>
    </template>
    <template #chart-config>
      <ChartConfig></ChartConfig>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import ChartName from './components/chart-name/index.vue'
import Column from './components/column/index.vue'
import DimensionOption from './components/dimension/index.vue'
import Filter from './components/filter/index.vue'
import Order from './components/order/index.vue'
import GroupOption from './components/group/index.vue'
import Bar from './components/bar/index.vue'
import Chart from './components/chart/index.vue'
import ChartType from './components/chart-type/index.vue'
import ChartConfig from './components/chart-config/index.vue'
import { getChartDataHandler } from './getChartData-handler'
const { queryChartData, queryChartDataParams } =
  getChartDataHandler()
const layoutName = 'analyse'
// const router = useRouter()
const columnStore = useColumnStore()
const filterStore = useFilterStore()
const orderStore = useOrderStore()
const dimensionStore = useDimensionStore()
const groupStore = useGroupStore()
const chartConfigStore = useChartConfigStore()
const chartStore = useChartStore()
const chartName = computed(() => {
  return chartStore.getChartName
})
/**
 * @desc 查询表格列
 * @param tableName
 * @returns {Promise<void>}
 */
const queryTableColumns = async (tableName: string) => {
  const result = await $fetch('/api/queryTableColumns', {
    method: 'GET',
    params: {
      tableName
    }
  })
  if (result.code === 200) {
    const cloumns = result.data?.map((item) => {
      return {
        ...item,
        columnName: item.columnName || '',
        columnType: item.columnType || '',
        columnComment: item.columnComment || '',
        displayName: item.displayName || '',
        alias: item.alias || ''
      }
    })
    columnStore.setColumns(cloumns || [])
  } else {
    columnStore.setDataSourceOptions([])
  }
}
/**
 * @desc 监听表格数据源变化
 */
watch(
  () => columnStore.getDataSource,
  (newDataSource, oldDataSource) => {
    if (!newDataSource) return
    queryTableColumns(newDataSource)
    // 如果手动变更数据源，清空图表数据
    if (oldDataSource) {
      // 如果数据源变化，清空筛选条件
      filterStore.setFilters([])
      // 如果数据源变化，清空排序条件
      orderStore.setOrders([])
      // 如果数据源变化，清空分组条件
      groupStore.setGroups([])
      // 如果数据源变化，清空维度条件
      dimensionStore.setDimensions([])
    }
  },
  {
    // immediate: true
  }
)

/**
 * @desc 监听查询表格数据的参数变化
 */
watch(
  () => queryChartDataParams.value,
  () => {
    queryChartData()
  },
  {
    deep: true,
    immediate: true
  }
)

/**
 * @desc 获取图表
 */
const getChart = async () => {
  const router = useRouter()
  const id = router.currentRoute.value.query.id
  if (!id) return
  const result = await $fetch('/api/getChart', {
    method: 'post',
    body: {
      id
    }
  })
  if (result.code === 200) {
    const data = result.data!
    const chartName = data.chartName
    chartStore.setChartName(chartName)
    const chartDesc = data.chartDesc
    chartStore.setChartDesc(chartDesc)
    const id = data.id
    chartStore.setChartId(id)
    const chartConfigId = data.chartConfigId
    chartStore.setChartConfigId(chartConfigId)
    const chartConfig = data.chartConfig
    const {
      column,
      dimension,
      filter,
      group,
      order,
      dataSource
    } = chartConfig
    columnStore.setColumns(column || [])
    dimensionStore.setDimensions(dimension || [])
    filterStore.setFilters(filter || [])
    groupStore.setGroups(group || [])
    orderStore.setOrders(order || [])
    columnStore.setDataSource(dataSource || '')
    dimensionStore.setDimensions(dimension || [])
    filterStore.setFilters(filter || [])
    groupStore.setGroups(group || [])
    orderStore.setOrders(order || [])
  }
}

onMounted(() => {
  getChart()
})
</script>

<style scoped lang="scss"></style>
