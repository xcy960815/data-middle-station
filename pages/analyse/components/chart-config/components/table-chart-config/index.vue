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
      <el-input v-model="tableChartConfig.rowHeight" placeholder="行高" @change="handleUpdateTableConfig"></el-input>
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

  <!-- 条件格式dialog -->
  <client-only>
    <el-dialog v-model="conditionDialogVisible" title="条件格式设置" width="50%">
      <el-form label-position="left" label-width="auto">
        <el-icon :size="18" class="cursor-pointer" @click="handleAddCondition">
          <CirclePlus />
        </el-icon>
        <el-row v-for="(condition, index) in conditionsState.conditions">
          <el-col :span="3">
            <el-form-item>
              <el-select v-model="condition.conditionType" placeholder="条件类型">
                <el-option label="单色" value="单色" />
                <el-option label="色阶" value="色阶" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <!-- 字段 -->
              <el-select v-model="condition.conditionField" placeholder="条件字段">
                <el-option
                  v-for="field in fields"
                  :label="field.displayName || field.columnName"
                  :value="field.columnName"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="condition.conditionType === '单色'">
            <el-form-item>
              <!-- 条件 -->
              <el-select v-model="condition.conditionSymbol" placeholder="条件">
                <!-- 介于 -->
                <el-option label="介于" value="between" />
                <el-option label="大于" value="gt" />
                <el-option label="小于" value="lt" />
                <el-option label="等于" value="eq" />
                <el-option label="不等于" value="neq" />
                <el-option label="大于等于" value="gte" />
                <el-option label="小于等于" value="lte" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="condition.conditionType === '单色' && condition.conditionSymbol !== 'between'">
            <el-form-item>
              <!-- 适用于非介于的情况 -->
              <el-input v-model="condition.conditionValue" placeholder="条件值"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="condition.conditionType === '单色' && condition.conditionSymbol === 'between'">
            <el-form-item>
              <!-- 适用于介于的情况 -->
              <el-input v-model="condition.conditionMinValue" placeholder="条件最小值"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="condition.conditionType === '单色' && condition.conditionSymbol === 'between'">
            <el-form-item>
              <!-- 适用于介于的情况 -->
              <el-input v-model="condition.conditionMaxValue" placeholder="条件最大值"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <!-- 单色颜色 -->
              <el-select
                v-model="condition.conditionColor"
                class="condition-color-select"
                @change="handleColorChange(condition.conditionColor, index)"
                placeholder="颜色"
              >
                <el-option-group
                  v-for="monochromeColorOption in monochromeColorList"
                  :key="monochromeColorOption.label"
                  :label="monochromeColorOption.label"
                >
                  <el-option
                    v-for="item in monochromeColorOption.options"
                    :key="item.color"
                    :label="item.label"
                    :value="item.color"
                  >
                    <span style="float: left; font-weight: 700" :style="{ color: item.color }">██████</span>
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 删除 -->
          <el-col :span="1">
            <el-button type="danger" circle @click="handleDeleteCondition(index)">
              <el-icon class="cursor-pointer" :size="14">
                <Delete />
              </el-icon>
            </el-button>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="conditionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm"> 保存 </el-button>
        </span>
      </template>
    </el-dialog>
  </client-only>
</template>

<script lang="ts" setup>
/**
 * @desc 条件格式dialog
 */
const conditionDialogVisible = ref(false)
/**
 * @desc 图表配置store
 */
const chartsConfigStore = useChartConfigStore()
/**
 * @desc 维度store
 */
const dimensionStore = useDimensionStore()
/**
 * @desc 分组store
 */
const groupStore = useGroupStore()

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
  rowHeight: 32,
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
    tableChartConfig.conditions = chartsConfigStore.chartConfig.table.conditions
  }
})

/**
 * @desc 条件符号映射
 */
const conditionSymbolMap: { [k: string]: string } = {
  between: '介于',
  gt: '大于',
  lt: '小于',
  eq: '等于',
  neq: '不等于',
  gte: '大于等于',
  lte: '小于等于'
}

// 单色配色列表
/**
 * @desc 单色配色列表
 */
const monochromeColorList = [
  {
    label: '红色系',
    options: [
      { label: '██████', color: 'rgb(235, 80, 126)' },
      { label: '██████', color: 'rgb(238, 75, 75)' },
      { label: '██████', color: 'rgb(173, 27, 7)' }
    ]
  },
  {
    label: '绿色系',
    options: [
      { label: '██████', color: 'rgb(67, 178, 68)' },
      { label: '██████', color: 'rgb(64, 162, 118)' },
      { label: '██████', color: 'rgb(18, 161, 130)' }
    ]
  },
  {
    label: '黄色系',
    options: [
      { label: '██████', color: 'rgb(250, 204, 135)' },
      { label: '██████', color: 'rgb(241, 202, 23)' },
      { label: '██████', color: 'rgb(252, 161, 4)' }
    ]
  },
  {
    label: '蓝色系',
    options: [
      { label: '██████', color: 'rgb(114, 175, 217)' },
      { label: '██████', color: 'rgb(19 ,138 ,221)' },
      { label: '██████', color: 'rgb(169, 153, 201)' }
    ]
  }
]

/**
 * @desc 多色配色列表
 */
const multiColorList = [
  { label: '██████', color: 'rgb(255, 117, 78)' },
  { label: '██████', color: 'rgb(247, 144, 163)' },
  { label: '██████', color: 'rgb(140, 192, 253)' },
  { label: '██████', color: 'rgb(25, 170, 209)' },
  { label: '██████', color: 'rgb(109, 215, 163)' },
  { label: '██████', color: 'rgb(147, 190, 196)' },
  { label: '██████', color: 'rgb(253, 240, 111)' },
  { label: '██████', color: 'rgb(195, 86, 145)' }
]

/**
 * @desc 条件状态
 */
const conditionsState = reactive<{
  conditions: Array<ChartConfigStore.ConditionOption>
}>({
  conditions: []
})
/**
 * @desc 可以选择的字段
 * @returns Array<Dimension | Group>
 */
const fields = computed(() => {
  const fields = dimensionStore.getDimensions.concat(groupStore.getGroups).filter((field) => {
    return (
      field.columnType?.includes('int') || field.columnType?.includes('float') || field.columnType?.includes('double')
    )
  })

  return fields
})

/**
 * @desc 打开条件格式dialog
 * @returns void
 */
const handleOpenConditionDialog = (): void => {
  conditionDialogVisible.value = true
  conditionsState.conditions = JSON.parse(JSON.stringify(chartsConfigStore.chartConfig?.table.conditions || []))
  nextTick(() => {
    conditionsState.conditions.forEach((condition, index) => {
      handleColorChange(condition.conditionColor, index)
    })
  })
}

/**
 * @desc 添加条件
 * @returns {void}
 */
const handleAddCondition = () => {
  const condition: ChartConfigStore.ConditionOption = {
    // 条件
    conditionType: '单色',
    // 条件字段
    conditionField: '',
    // 条件符号
    conditionSymbol: 'gt',
    // 最小范围值
    conditionMinValue: '',
    // 最大范围值
    conditionMaxValue: '',
    // 条件值
    conditionValue: '',
    // 条件颜色
    conditionColor: ''
  }
  conditionsState.conditions.push(condition)
}

/**
 * @desc 处理颜色改变
 * @param color {string} 颜色
 * @param index {number} 下标
 * @returns {void}
 */
const handleColorChange = (color: string, index: number): void => {
  const inputNodeList = document.querySelectorAll<HTMLInputElement>('.condition-color-select  input')
  if (inputNodeList && inputNodeList.length) {
    const inputNode = inputNodeList[index]
    inputNode.style.color = color
    inputNode.style.fontSize = '16px'
  }
}
/**
 * @desc 删除条件
 * @param index {number} 下标
 * @returns {void}
 */
const handleDeleteCondition = (index: number): void => {
  // chartsConfigStore.deleteTableChartConditions(index)
  conditionsState.conditions.splice(index, 1)
}
/**
 * @desc 确认
 * @returns {void}
 */
const handleConfirm = (): void => {
  chartsConfigStore.setTableChartConditions(conditionsState.conditions)
  conditionDialogVisible.value = false
}

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
