<template>
  <el-form label-position="top" label-width="auto" :model="tableChartConfig">
    <!-- 行高亮 -->
    <el-form-item label="行高亮">
      <el-switch
        @change="handleUpdateTableConfig"
        v-model="tableChartConfig.enableRowHoverHighlight"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <!-- 列高亮 -->
    <el-form-item label="列高亮">
      <el-switch
        @change="handleUpdateTableConfig"
        v-model="tableChartConfig.enableColHoverHighlight"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <!-- 是否显示边框 -->
    <el-form-item label="是否显示边框">
      <el-switch
        @change="handleUpdateTableConfig"
        v-model="tableChartConfig.border"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <!-- highlightCellBackground -->
    <el-form-item label="高亮 cell 背景色">
      <el-color-picker v-model="tableChartConfig.highlightCellBackground" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- 表头高度 -->
    <el-form-item label="表头高度">
      <el-input
        v-model="tableChartConfig.headerHeight"
        placeholder="表头高度"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 表头字体大小 -->
    <el-form-item label="表头字体大小">
      <el-input
        v-model="tableChartConfig.headerFontSize"
        placeholder="表头字体大小"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <el-form-item label="表头字体">
      <el-select
        v-model="tableChartConfig.headerFontFamily"
        placeholder="请选择表头字体"
        @change="handleUpdateTableConfig"
      >
        <el-option v-for="item in fontFamilyOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <!-- 表头文本颜色 -->
    <el-form-item label="表头文本颜色">
      <el-color-picker v-model="tableChartConfig.headerTextColor" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- 表头背景色 -->
    <el-form-item label="表头背景色">
      <el-color-picker v-model="tableChartConfig.headerBackground" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- 表格文本颜色 -->
    <el-form-item label="表格文本颜色">
      <el-color-picker v-model="tableChartConfig.bodyTextColor" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- 行高 -->
    <el-form-item label="行高">
      <el-input
        v-model="tableChartConfig.bodyRowHeight"
        placeholder="行高"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 表格字体 -->
    <el-form-item label="表格字体">
      <el-select
        v-model="tableChartConfig.bodyFontFamily"
        placeholder="请选择表格字体"
        @change="handleUpdateTableConfig"
      >
        <el-option v-for="item in fontFamilyOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <!-- 表格字体大小 -->
    <el-form-item label="表格字体大小">
      <el-input
        v-model="tableChartConfig.bodyFontSize"
        placeholder="表格字体大小"
        @blur="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <el-form-item label="是否展示汇总行">
      <el-switch
        @change="handleUpdateTableConfig"
        v-model="tableChartConfig.showSummary"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <!-- 汇总高度 -->
    <el-form-item label="汇总行高度">
      <el-input
        v-model="tableChartConfig.summaryHeight"
        placeholder="汇总行高度"
        @blur="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 汇总行字体 -->
    <el-form-item label="汇总行字体">
      <el-input
        v-model="tableChartConfig.summaryFontFamily"
        placeholder="汇总行字体"
        @blur="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 汇总字体大小 -->
    <el-form-item label="汇总行字体大小">
      <el-input
        v-model="tableChartConfig.summaryFontSize"
        placeholder="汇总行字体大小"
        @blur="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 汇总文本颜色 -->
    <el-form-item label="汇总行文本颜色">
      <el-color-picker v-model="tableChartConfig.summaryTextColor" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- 汇总背景色 -->
    <el-form-item label="汇总行背景色">
      <el-color-picker v-model="tableChartConfig.summaryBackground" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- 滚动条背景色 -->
    <el-form-item label="滚动条背景色">
      <el-color-picker v-model="tableChartConfig.scrollbarBackground" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- 滚动条滑块颜色 -->
    <el-form-item label="滚动条滑块颜色">
      <el-color-picker v-model="tableChartConfig.scrollbarThumb" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- 滚动条滑块悬停颜色 -->
    <el-form-item label="滚动条滑块悬停颜色">
      <el-color-picker v-model="tableChartConfig.scrollbarThumbHover" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- 缓冲行数 -->
    <el-form-item label="缓冲行数">
      <el-input
        v-model="tableChartConfig.bufferRows"
        placeholder="缓冲行数"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 最小自动列宽度 -->
    <el-form-item label="滚动条大小">
      <el-input
        v-model="tableChartConfig.scrollbarSize"
        placeholder="滚动条大小"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- tablePadding -->
    <el-form-item label="表格内边距">
      <el-input
        v-model="tableChartConfig.tablePadding"
        placeholder="表格内边距"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- bodyBackgroundOdd -->
    <el-form-item label="表格奇数行背景色">
      <el-color-picker v-model="tableChartConfig.bodyBackgroundOdd" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- bodyBackgroundEven -->
    <el-form-item label="表格偶数行背景色">
      <el-color-picker v-model="tableChartConfig.bodyBackgroundEven" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- borderColor -->
    <el-form-item label="表格边框颜色">
      <el-color-picker v-model="tableChartConfig.borderColor" @change="handleUpdateTableConfig" />
    </el-form-item>

    <!-- bodyTextColor -->
    <el-form-item label="表格文本颜色">
      <el-color-picker v-model="tableChartConfig.bodyTextColor" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- bodyFontFamily -->
    <el-form-item label="表格字体">
      <el-input
        v-model="tableChartConfig.bodyFontFamily"
        placeholder="表格字体"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
/**
 * @desc 图表配置store
 */
const chartsConfigStore = useChartConfigStore()
/**
 * @desc 表格配置数据
 */
const tableChartConfig = reactive<ChartConfigStore.TableChartConfig>({
  conditions: [],
  showSummary: false,
  enableRowHoverHighlight: false,
  enableColHoverHighlight: false,
  border: false,
  highlightCellBackground: 'rgba(24, 144, 255, 0.12)',
  headerHeight: 32,
  summaryHeight: 32,
  enableSummary: false,
  bodyRowHeight: 32,
  scrollbarSize: 16,
  tablePadding: 0,
  headerBackground: '#f9fafb',
  bodyBackgroundOdd: '#ffffff',
  bodyBackgroundEven: '#f9fafb',
  borderColor: '#d1d5db',
  headerTextColor: '#374151',
  headerFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  headerFontSize: 14,
  bodyTextColor: '#374151',
  bodyFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  bodyFontSize: 14,
  summaryFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  summaryFontSize: 14,
  summaryBackground: '#f9fafb',
  summaryTextColor: '#374151',
  scrollbarBackground: '#f3f4f6',
  scrollbarThumb: '#d1d5db',
  scrollbarThumbHover: '#9ca3af',
  bufferRows: 5,
  minAutoColWidth: 80,
  scrollThreshold: 3,
  headerSortActiveBackground: '#e5e7eb',
  sortableColor: '#6b7280'
})

onMounted(() => {
  if (chartsConfigStore.chartConfig.table) {
    tableChartConfig.bodyBackgroundEven = chartsConfigStore.chartConfig.table.bodyBackgroundEven
    tableChartConfig.bodyBackgroundOdd = chartsConfigStore.chartConfig.table.bodyBackgroundOdd
    tableChartConfig.borderColor = chartsConfigStore.chartConfig.table.borderColor
    tableChartConfig.headerBackground = chartsConfigStore.chartConfig.table.headerBackground
    tableChartConfig.headerTextColor = chartsConfigStore.chartConfig.table.headerTextColor
    tableChartConfig.headerFontFamily = chartsConfigStore.chartConfig.table.headerFontFamily
    tableChartConfig.headerFontSize = chartsConfigStore.chartConfig.table.headerFontSize
    tableChartConfig.bodyFontFamily = chartsConfigStore.chartConfig.table.bodyFontFamily
    tableChartConfig.bodyFontSize = chartsConfigStore.chartConfig.table.bodyFontSize
    tableChartConfig.summaryFontFamily = chartsConfigStore.chartConfig.table.summaryFontFamily
    tableChartConfig.summaryFontSize = chartsConfigStore.chartConfig.table.summaryFontSize
    tableChartConfig.summaryBackground = chartsConfigStore.chartConfig.table.summaryBackground
    tableChartConfig.summaryTextColor = chartsConfigStore.chartConfig.table.summaryTextColor
    tableChartConfig.scrollbarBackground = chartsConfigStore.chartConfig.table.scrollbarBackground
    tableChartConfig.scrollbarThumb = chartsConfigStore.chartConfig.table.scrollbarThumb
    tableChartConfig.scrollbarThumbHover = chartsConfigStore.chartConfig.table.scrollbarThumbHover
    tableChartConfig.bufferRows = chartsConfigStore.chartConfig.table.bufferRows
    tableChartConfig.minAutoColWidth = chartsConfigStore.chartConfig.table.minAutoColWidth
    tableChartConfig.scrollThreshold = chartsConfigStore.chartConfig.table.scrollThreshold
    tableChartConfig.headerSortActiveBackground = chartsConfigStore.chartConfig.table.headerSortActiveBackground
    tableChartConfig.sortableColor = chartsConfigStore.chartConfig.table.sortableColor
    tableChartConfig.conditions = JSON.parse(
      JSON.stringify(chartsConfigStore.chartConfig.table.conditions)
    ) as ChartConfigStore.TableChartConfig['conditions']

    tableChartConfig.showSummary = chartsConfigStore.chartConfig.table.showSummary
    tableChartConfig.enableRowHoverHighlight = chartsConfigStore.chartConfig.table.enableRowHoverHighlight
    tableChartConfig.enableColHoverHighlight = chartsConfigStore.chartConfig.table.enableColHoverHighlight
    tableChartConfig.border = chartsConfigStore.chartConfig.table.border
    tableChartConfig.highlightCellBackground = chartsConfigStore.chartConfig.table.highlightCellBackground
    tableChartConfig.headerHeight = chartsConfigStore.chartConfig.table.headerHeight
    tableChartConfig.summaryHeight = chartsConfigStore.chartConfig.table.summaryHeight
    tableChartConfig.enableSummary = chartsConfigStore.chartConfig.table.enableSummary
  }
})

/**
 * @desc 更新表格配置
 * @returns {void}
 */
const handleUpdateTableConfig = (): void => {
  chartsConfigStore.setTableChartConfig(tableChartConfig)
}

const fontFamilyOptions = [
  {
    label: '系统默认',
    value: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif'
  },
  {
    label: '微软雅黑',
    value: "'Microsoft YaHei', sans-serif"
  },
  {
    label: '苹方',
    value: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif"
  },
  {
    label: '宋体',
    value: "'SimSun', 'STSong', serif"
  },
  {
    label: '黑体',
    value: "'SimHei', 'STHeiti', sans-serif"
  },
  {
    label: 'Arial',
    value: 'Arial, Helvetica, sans-serif'
  },
  {
    label: 'Times New Roman',
    value: "'Times New Roman', Times, serif"
  }
]
</script>

<style scoped lang="scss"></style>
