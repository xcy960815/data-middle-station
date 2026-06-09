<template>
  <div class="table-demo-container">
    <el-divider content-position="left">测试场景</el-divider>
    <el-form label-width="auto" inline>
      <el-form-item label="数据行数">
        <el-select v-model="rowCount" style="width: 140px">
          <el-option v-for="option in rowCountOptions" :key="option" :label="`${option} 行`" :value="option" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用分组列">
        <el-switch v-model="enableGroupColumns" />
      </el-form-item>
      <el-form-item label="缓冲行数">
        <el-input-number v-model="tableConfig.bufferRows" :min="0" :max="30" />
      </el-form-item>
    </el-form>
    <el-divider content-position="left">样式配置</el-divider>
    <el-form label-width="auto" :model="tableConfig" inline>
      <el-form-item label="高亮 cell 背景色">
        <el-color-picker v-model="tableConfig.highlightCellBackground" show-alpha />
      </el-form-item>
      <el-form-item label="高亮行背景色">
        <el-color-picker v-model="tableConfig.highlightRowBackground" show-alpha />
      </el-form-item>
      <el-form-item label="高亮列背景色">
        <el-color-picker v-model="tableConfig.highlightColBackground" show-alpha />
      </el-form-item>
      <el-form-item label="表头高度">
        <el-input-number v-model="tableConfig.headerRowHeight" :step="10" />
      </el-form-item>
      <el-form-item label="表头字体大小">
        <el-input-number v-model="tableConfig.headerFontSize" :step="2" />
      </el-form-item>
      <el-form-item label="表头字体">
        <el-select style="width: 200px" v-model="tableConfig.headerFontFamily" placeholder="请选择表头字体">
          <el-option v-for="item in fontFamilyOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="表头文本颜色">
        <el-color-picker v-model="tableConfig.headerTextColor" show-alpha />
      </el-form-item>
      <el-form-item label="表头背景色">
        <el-color-picker v-model="tableConfig.headerBackground" show-alpha />
      </el-form-item>
      <el-form-item label="表格文本颜色">
        <el-color-picker v-model="tableConfig.bodyTextColor" show-alpha />
      </el-form-item>
      <el-form-item label="表格奇数行背景色">
        <el-color-picker v-model="tableConfig.bodyBackgroundOdd" show-alpha />
      </el-form-item>
      <el-form-item label="表格偶数行背景色">
        <el-color-picker v-model="tableConfig.bodyBackgroundEven" show-alpha />
      </el-form-item>
      <el-form-item label="滚动条背景色">
        <el-color-picker v-model="tableConfig.scrollbarBackground" show-alpha />
      </el-form-item>
      <el-form-item label="滚动条滑块颜色">
        <el-color-picker v-model="tableConfig.scrollbarThumbBackground" show-alpha />
      </el-form-item>
      <el-form-item label="滚动条滑块悬停颜色">
        <el-color-picker v-model="tableConfig.scrollbarThumbHoverBackground" show-alpha />
      </el-form-item>
      <el-form-item label="拖拽图标高度">
        <el-input-number v-model="tableConfig.dragIconHeight" :min="8" :max="32" :step="2" />
      </el-form-item>
      <el-form-item label="拖拽图标宽度">
        <el-input-number v-model="tableConfig.dragIconWidth" :min="6" :max="20" :step="1" />
      </el-form-item>
      <el-form-item label="是否展示汇总">
        <el-switch v-model="tableConfig.enableSummary" />
      </el-form-item>
      <el-form-item label="汇总高度">
        <el-input-number v-model="tableConfig.summaryRowHeight" :step="10" />
      </el-form-item>
      <el-form-item label="表格高度">
        <el-input-number v-model="tableConfig.chartHeight" :step="100" />
      </el-form-item>
      <el-form-item label="表格宽度">
        <el-input-number v-model="tableConfig.chartWidth" :step="100" />
      </el-form-item>
    </el-form>
    <!-- 合并单元格配置 -->
    <el-divider content-position="left">合并单元格配置</el-divider>
    <el-form label-width="auto" :model="spanConfig" inline>
      <el-form-item label="启用合并单元格">
        <el-switch v-model="spanConfig.enableSpan" />
      </el-form-item>
      <el-form-item label="第一列合并行数">
        <el-input-number v-model="spanConfig.firstColSpan" :min="1" :max="5" />
      </el-form-item>
      <el-form-item label="第二列合并行数">
        <el-input-number v-model="spanConfig.secondColSpan" :min="1" :max="5" />
      </el-form-item>
      <el-form-item label="启用列合并示例">
        <el-switch v-model="spanConfig.enableColSpan" />
      </el-form-item>
    </el-form>
    <el-divider content-position="left">Canvas Table 性能面板</el-divider>
    <div class="perf-panel">
      <div class="perf-toolbar">
        <div class="perf-runtime">
          <span>源数据 {{ perfSnapshot.sourceRows }} 行</span>
          <span>过滤后 {{ perfSnapshot.processedRows }} 行</span>
          <span>分组列 {{ perfSnapshot.groupColumnCount }}</span>
          <span>值列 {{ perfSnapshot.measureColumnCount }}</span>
          <span>可视行 {{ perfSnapshot.visibleRows }}</span>
          <span>缓冲 {{ perfSnapshot.bufferRows }}</span>
          <span>scrollX {{ perfSnapshot.scrollX }}</span>
          <span>scrollY {{ perfSnapshot.scrollY }}</span>
          <span>舞台 {{ perfSnapshot.stageWidth }} x {{ perfSnapshot.stageHeight }}</span>
        </div>
        <div class="perf-toolbar-actions">
          <el-button size="small" :loading="stressLoading" @click="handleRunScrollStress">滚动压测</el-button>
          <el-button size="small" @click="handleResetPerfMetrics">重置指标</el-button>
        </div>
      </div>
      <div class="perf-overview-grid">
        <div v-for="card in perfOverviewCards" :key="card.key" class="perf-overview-card">
          <div class="perf-overview-label">{{ card.label }}</div>
          <div class="perf-overview-value">{{ card.value }}</div>
          <div class="perf-overview-meta">{{ card.meta }}</div>
        </div>
      </div>
      <div v-for="section in perfMetricSections" :key="section.key" class="perf-section">
        <div class="perf-section-title">{{ section.title }}</div>
        <div class="perf-metric-grid">
          <div v-for="metric in section.metrics" :key="metric.key" class="perf-metric-card">
            <div class="perf-metric-head">
              <div>
                <div class="perf-metric-title">{{ metric.label }}</div>
                <div class="perf-metric-subtitle">最近 {{ metric.recent.length || 0 }} 次样本</div>
              </div>
              <div class="perf-metric-badges">
                <span class="perf-badge">count {{ metric.count }}</span>
                <span class="perf-badge">p95 {{ formatPerfMs(metric.p95) }}</span>
              </div>
            </div>
            <div class="perf-metric-values">
              <span>last {{ formatPerfMs(metric.last) }}</span>
              <span>avg {{ formatPerfMs(metric.avg) }}</span>
              <span>max {{ formatPerfMs(metric.max) }}</span>
            </div>
            <div class="perf-meter">
              <div class="perf-meter-fill" :style="{ width: `${metric.budgetUsage}%` }"></div>
            </div>
            <div class="perf-metric-values">
              <span>超 16ms {{ metric.over16 }}</span>
              <span>超 33ms {{ metric.over33 }}</span>
            </div>
            <div class="perf-sparkline">
              <div
                v-for="(sample, index) in metric.sparkline"
                :key="`${metric.key}-${index}`"
                class="perf-sparkline-bar"
                :class="{
                  'is-warning': sample.value > 16.7,
                  'is-danger': sample.value > 33.3
                }"
                :style="{ height: sample.height }"
                :title="formatPerfMs(sample.value)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <client-only>
      <CanvasTable
        ref="canvasTableRef"
        :enable-summary="tableConfig.enableSummary"
        :summary-row-height="tableConfig.summaryRowHeight"
        :chart-height="tableConfig.chartHeight"
        :chart-width="tableConfig.chartWidth"
        :x-axis-fields="xAxisFields as CanvasTable.ColumnOption[]"
        :highlight-cell-background="tableConfig.highlightCellBackground"
        :header-text-color="tableConfig.headerTextColor"
        :body-text-color="tableConfig.bodyTextColor"
        :header-font-family="tableConfig.headerFontFamily"
        :header-font-size="tableConfig.headerFontSize"
        :header-row-height="tableConfig.headerRowHeight"
        :body-font-family="tableConfig.bodyFontFamily"
        :body-font-size="tableConfig.bodyFontSize"
        :body-row-height="tableConfig.bodyRowHeight"
        :summary-font-family="tableConfig.summaryFontFamily"
        :summary-font-size="tableConfig.summaryFontSize"
        :header-background="tableConfig.headerBackground"
        :summary-background="tableConfig.summaryBackground"
        :summary-text-color="tableConfig.summaryTextColor"
        :body-background-odd="tableConfig.bodyBackgroundOdd"
        :body-background-even="tableConfig.bodyBackgroundEven"
        :scrollbar-background="tableConfig.scrollbarBackground"
        :scrollbar-thumb-background="tableConfig.scrollbarThumbBackground"
        :scrollbar-thumb-hover-background="tableConfig.scrollbarThumbHoverBackground"
        :buffer-rows="tableConfig.bufferRows"
        :min-auto-col-width="tableConfig.minAutoColWidth"
        :sort-active-color="tableConfig.sortActiveColor"
        :y-axis-fields="yAxisFields as CanvasTable.ColumnOption[]"
        :data="data"
        :highlight-row-background="tableConfig.highlightRowBackground"
        :highlight-col-background="tableConfig.highlightColBackground"
        :drag-icon-height="tableConfig.dragIconHeight"
        :drag-icon-width="tableConfig.dragIconWidth"
        :drag-icon-dot-size="4"
        :span-method="spanMethod"
        @column-width-change="handleColumnWidthChange"
        @column-order-change="handleColumnOrderChange"
      >
      </CanvasTable>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import CanvasTable from '@/components/table-chart/canvas-table.vue'
import type { ColumnOrderChangePayload, ColumnWidthChangePayload } from '@/components/table-chart/parameter'
import {
  formatPerfMs,
  getPerfBudgetUsage,
  resetTablePerfState,
  TABLE_PERF_METRIC_SECTIONS,
  tablePerfState
} from '@/components/table-chart/perf'
import { ElMessage } from 'element-plus'

const rowCountOptions = [1000, 5000, 10000, 50000] as const
const rowCount = ref<(typeof rowCountOptions)[number]>(1000)
const enableGroupColumns = ref(true)
const canvasTableRef = ref<InstanceType<typeof CanvasTable> | null>(null)
const stressLoading = ref(false)

const perfSnapshot = computed(() => tablePerfState.snapshot)

const buildMetricView = (key: (typeof TABLE_PERF_METRIC_SECTIONS)[number]['metrics'][number]) => {
  const metric = tablePerfState.metrics[key]
  return {
    key,
    ...metric,
    budgetUsage: getPerfBudgetUsage(metric.p95),
    sparkline: metric.recent.map((value) => ({
      value,
      height: `${Math.max(10, Math.min(100, (value / 33.3) * 100))}%`
    }))
  }
}

const perfMetricSections = computed(() =>
  TABLE_PERF_METRIC_SECTIONS.map((section) => ({
    ...section,
    metrics: section.metrics.map((key) => buildMetricView(key))
  }))
)

const perfOverviewCards = computed(() => [
  {
    key: 'firstRender',
    label: '首屏渲染',
    value: formatPerfMs(tablePerfState.metrics.firstRender.last),
    meta: `p95 ${formatPerfMs(tablePerfState.metrics.firstRender.p95)}`
  },
  {
    key: 'handleTableData',
    label: '数据处理',
    value: formatPerfMs(tablePerfState.metrics.handleTableData.last),
    meta: `avg ${formatPerfMs(tablePerfState.metrics.handleTableData.avg)}`
  },
  {
    key: 'refreshTable',
    label: '整表刷新',
    value: formatPerfMs(tablePerfState.metrics.refreshTable.last),
    meta: `p95 ${formatPerfMs(tablePerfState.metrics.refreshTable.p95)}`
  },
  {
    key: 'verticalScroll',
    label: '纵向滚动',
    value: formatPerfMs(tablePerfState.metrics.verticalScroll.last),
    meta: `p95 ${formatPerfMs(tablePerfState.metrics.verticalScroll.p95)}`
  }
])

const handleResetPerfMetrics = () => {
  resetTablePerfState()
}

const handleRunScrollStress = async () => {
  if (!canvasTableRef.value) {
    ElMessage.warning('表格尚未就绪')
    return
  }

  stressLoading.value = true
  try {
    const result = await canvasTableRef.value.runScrollStressTest({
      verticalSteps: 200,
      horizontalSteps: 100
    })
    if (!result) {
      ElMessage.warning('压测未执行')
      return
    }

    ElMessage.success(
      `压测完成：纵向 ${result.verticalSteps} 次 p95 ${formatPerfMs(result.verticalP95)}，横向 ${result.horizontalSteps} 次 p95 ${formatPerfMs(result.horizontalP95)}`
    )
  } finally {
    stressLoading.value = false
  }
}

const createDimensionColumns = (): DemoTableColumn[] => [
  {
    columnName: 'department',
    columnType: 'string',
    columnComment: '部门',
    displayName: '部门',
    fixed: 'left',
    width: 140,
    align: 'left',
    resizable: true,
    draggable: true,
    filterable: true,
    sortable: true
  }
]

const dimensionColumns = ref<DemoTableColumn[]>(createDimensionColumns())

const xAxisFields = computed(() => (enableGroupColumns.value ? dimensionColumns.value : []))

watch(enableGroupColumns, (enabled) => {
  if (enabled && dimensionColumns.value.length === 0) {
    dimensionColumns.value = createDimensionColumns()
  }
})

const handleColumnWidthChange = ({ columnName, width }: ColumnWidthChangePayload) => {
  if (dimensionColumns.value.some((column) => column.columnName === columnName)) {
    dimensionColumns.value = dimensionColumns.value.map((column) =>
      column.columnName === columnName ? { ...column, width } : column
    )
    return
  }

  yAxisFields.value = yAxisFields.value.map((column) =>
    column.columnName === columnName ? { ...column, width } : column
  )
}

const handleColumnOrderChange = ({
  xAxisFields: nextXAxisFields,
  yAxisFields: nextYAxisFields
}: ColumnOrderChangePayload) => {
  dimensionColumns.value = nextXAxisFields.map((column) => ({ ...column })) as DemoTableColumn[]
  enableGroupColumns.value = nextXAxisFields.length > 0
  yAxisFields.value = nextYAxisFields.map((column) => ({ ...column })) as DemoTableColumn[]
}

// 合并单元格配置
const spanConfig = reactive({
  enableSpan: true,
  firstColSpan: 3, // 第一列合并行数
  secondColSpan: 2, // 第二列合并行数
  enableColSpan: false // 是否启用列合并
})

const spanMethod = ({
  row: _row,
  column: _column,
  rowIndex,
  colIndex
}: {
  row: AnalyzeDataVo.AnalyzeData
  column: DimensionStore.DimensionOption | MeasureStore.MeasureOption
  rowIndex: number
  colIndex: number
}): { rowspan: number; colspan: number } => {
  // 如果禁用合并，直接返回不合并
  if (!spanConfig.enableSpan) {
    return { rowspan: 1, colspan: 1 }
  }

  // 第一列（序号列）- 序号列不应该合并，保持连续
  if (colIndex === 0) {
    return { rowspan: 1, colspan: 1 }
  }

  // 第二列（name列）- 可配置合并行数
  if (colIndex === 1 && spanConfig.secondColSpan > 1) {
    if (rowIndex % spanConfig.secondColSpan === 0) {
      return {
        rowspan: spanConfig.secondColSpan,
        colspan: 1
      }
    } else {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }

  // 第三列（age列）- 演示列合并
  if (colIndex === 2 && spanConfig.enableColSpan) {
    if (rowIndex % 4 === 0) {
      return {
        rowspan: 1,
        colspan: 2 // 合并2列
      }
    }
    if (rowIndex % 4 === 1) {
      return {
        rowspan: 0,
        colspan: 0 // 被合并的列
      }
    }
  }

  // 第四列 - 当第三列合并时需要处理
  if (colIndex === 3 && spanConfig.enableColSpan) {
    if (rowIndex % 4 === 0) {
      return {
        rowspan: 0,
        colspan: 0 // 被第三列合并
      }
    }
  }

  // 演示复杂合并：某些特定位置的行列同时合并
  if (colIndex === 4 && rowIndex % 6 === 0) {
    return {
      rowspan: 2,
      colspan: 2
    }
  }
  if ((colIndex === 4 && rowIndex % 6 === 1) || (colIndex === 5 && (rowIndex % 6 === 0 || rowIndex % 6 === 1))) {
    return {
      rowspan: 0,
      colspan: 0
    }
  }

  return {
    rowspan: 1,
    colspan: 1
  }
}
/**
 * Demo 页面松散列类型，混合了语义字段与表格 UI 属性。
 * 仅用于演示，正式分析页中 UI 属性属于 privateChartConfig.table.columns。
 */
type DemoTableColumn = {
  columnName: string
  columnType: string
  columnComment: string
  displayName: string
  fixed?: string | null
  width?: number | null
  align?: string | null
  filterable?: boolean
  editable?: boolean
  editType?: string
  editOptions?: unknown
  resizable?: boolean
  draggable?: boolean
  sortable?: boolean
  showOverflowTooltip?: boolean
  measureRule?: MeasureStore.MeasureOption['measureRule']
  dimensionRule?: DimensionStore.DimensionOption['dimensionRule']
}

/**
 * 维度列
 */
const yAxisFields = ref<DemoTableColumn[]>([
  {
    columnName: '__index__',
    columnType: 'number',
    columnComment: '序号',
    displayName: '序号',
    fixed: 'left',
    width: 100,
    align: 'center',
    resizable: true
  },
  {
    columnName: 'id',
    columnType: 'number',
    columnComment: 'id',
    displayName: 'id',
    fixed: null,
    width: 200,
    align: null,
    filterable: true,
    editable: true,
    editType: 'input',
    resizable: true
  },
  {
    columnName: 'name',
    columnType: 'string',
    columnComment: 'name',
    displayName: 'name',
    fixed: null,
    width: 200,
    align: null,
    filterable: true,
    editable: true,
    editType: 'input',
    resizable: true,
    draggable: true
  },
  {
    columnName: 'age',
    columnType: 'number',
    columnComment: 'age',
    displayName: 'age',
    fixed: null,
    width: 200,
    align: null,
    sortable: true,
    editable: true,
    editType: 'input'
  },
  {
    columnName: 'gender',
    columnType: 'string',
    columnComment: 'gender',
    fixed: null,
    width: 200,
    align: null,
    filterable: true,
    sortable: true,
    displayName: 'gender',
    editable: true,
    editType: 'select',
    editOptions: [
      { label: '男性', value: 'Male' },
      { label: '女性', value: 'Female' },
      { label: '其他', value: 'Other' }
    ]
  },
  {
    columnName: 'country',
    columnType: 'string',
    columnComment: 'country',
    fixed: null,
    width: 200,
    align: null,
    resizable: true,
    draggable: true,
    filterable: true,
    sortable: true,
    displayName: 'country',
    editable: true,
    editType: 'select',
    editOptions: [
      { label: '中国', value: 'China' },
      { label: '美国', value: 'USA' },
      { label: '英国', value: 'UK' },
      { label: '德国', value: 'Germany' },
      { label: '法国', value: 'France' },
      { label: '日本', value: 'Japan' },
      { label: '加拿大', value: 'Canada' },
      { label: '澳大利亚', value: 'Australia' }
    ]
  },
  {
    columnName: 'city',
    columnType: 'string',
    columnComment: 'city',
    fixed: null,
    width: 200,
    align: null,
    filterable: true,
    sortable: true,
    displayName: 'city',
    editable: true,
    editType: 'input'
  },
  {
    columnName: 'state',
    columnType: 'string',
    columnComment: 'state',
    displayName: 'state',
    fixed: null,
    width: 200,
    align: null,
    editable: true,
    editType: 'input'
  },
  {
    columnName: 'zipcode',
    columnType: 'number',
    columnComment: 'zipcode',
    displayName: 'zipcode',
    fixed: null,
    width: 200,
    align: null,
    filterable: true,
    editable: true,
    editType: 'input',
    resizable: true
  },
  {
    columnName: 'address',
    columnType: 'string',
    columnComment: 'address',
    displayName: 'address',
    fixed: null,
    showOverflowTooltip: true,
    width: 200,
    align: null,
    editable: true,
    editType: 'input'
  },
  {
    columnName: 'phone',
    columnType: 'string',
    columnComment: 'phone',
    displayName: 'phone',
    fixed: null,
    width: 200,
    align: null,
    editable: true,
    editType: 'input'
  },
  {
    columnName: 'mobile',
    columnType: 'string',
    fixed: null,
    width: 200,
    align: null,
    columnComment: 'mobile',
    displayName: 'mobile',
    editable: true,
    editType: 'input'
  },
  {
    columnName: 'birthday',
    columnType: 'date',
    columnComment: '生日',
    displayName: '生日',
    fixed: null,
    width: 150,
    align: null,
    editable: true,
    editType: 'date'
  },
  {
    columnName: 'lastLogin',
    columnType: 'datetime',
    columnComment: '最后登录时间',
    displayName: '最后登录时间',
    width: 180,
    align: null,
    editable: true,
    editType: 'datetime',
    fixed: 'right' as const
  }
])

const createDemoRows = (count: number): Array<AnalyzeDataVo.AnalyzeData> =>
  Array.from({ length: count }, (_, i) => {
    const birthYear = 1970 + (i % 40)
    const birthMonth = (i % 12) + 1
    const birthDay = (i % 28) + 1
    const birthday = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`

    const lastLoginHour = i % 24
    const lastLoginMinute = (i * 7) % 60
    const lastLoginSecond = (i * 13) % 60
    const lastLogin = `2024-01-${((i % 30) + 1).toString().padStart(2, '0')} ${lastLoginHour.toString().padStart(2, '0')}:${lastLoginMinute.toString().padStart(2, '0')}:${lastLoginSecond.toString().padStart(2, '0')}`

    return {
      id: i + 1,
      name: `User ${i + 1}`,
      age: 18 + (i % 60),
      gender: ['Male', 'Female', 'Other'][(i * 3) % 3],
      country: ['China', 'USA', 'UK', 'Germany', 'France', 'Japan', 'Canada', 'Australia'][(i * 3) % 8],
      city: ['Beijing', 'Shanghai', 'New York', 'London', 'Berlin', 'Paris', 'Tokyo', 'Toronto', 'Sydney'][(i * 5) % 9],
      state: ['CA', 'NY', 'TX', 'FL', 'WA', 'IL', 'PA', 'OH', 'GA', 'NC'][(i * 7) % 10],
      zipcode: `${10000 + ((i * 123) % 90000)}`,
      address: `${i + 1} Main Street, Apt ${(i % 50) + 1}`,
      phone: `+1-555-${String(1000 + i).slice(-4)}`,
      mobile: `+1-666-${String(2000 + i).slice(-4)}`,
      birthday,
      lastLogin,
      company: ['TechCorp', 'DataSoft', 'CloudInc', 'WebSolutions', 'AppDev', 'SystemsLtd', 'CodeWorks', 'DigitalPro'][
        (i * 11) % 8
      ],
      department: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Support', 'Design'][
        (i * 13) % 8
      ],
      position: ['Developer', 'Manager', 'Analyst', 'Designer', 'Consultant', 'Specialist', 'Coordinator', 'Director'][
        (i * 17) % 8
      ],
      salary: `$${(30000 + ((i * 1000) % 120000)).toLocaleString()}`,
      experience: `${(i % 20) + 1} years`,
      education: ['Bachelor', 'Master', 'PhD', 'Associate', 'High School', 'Certificate'][(i * 19) % 6],
      skills: [
        'JavaScript, React',
        'Python, Django',
        'Java, Spring',
        'C#, .NET',
        'PHP, Laravel',
        'Go, Gin',
        'Ruby, Rails',
        'Node.js, Express'
      ][(i * 23) % 8],
      notes: `Additional notes for user ${i + 1}.`,
      email: `user${i + 1}@${['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'example.org'][(i * 29) % 5]}`
    }
  })

const data = shallowRef(createDemoRows(rowCount.value))

watch(rowCount, (count) => {
  data.value = createDemoRows(count)
  resetTablePerfState()
})

const tableConfig = reactive({
  enableSummary: true,
  summaryRowHeight: 32,
  highlightRowBackground: 'rgba(24, 144, 255, 0.15)',
  highlightColBackground: 'rgba(24, 144, 255, 0.15)',
  highlightCellBackground: 'rgba(24, 144, 255, 0.12)',
  headerRowHeight: 32,
  headerTextColor: '#303133',
  headerFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  headerFontSize: 14,
  headerBackground: '#fafafa', // 新增
  bodyTextColor: '#374151', // 新增
  bodyBackgroundOdd: '#ffffff', // 新增
  bodyBackgroundEven: '#fafafa', // 新增
  bodyFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  bodyFontSize: 13,
  summaryFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  summaryFontSize: 14,
  summaryBackground: '#f7f7f9',
  summaryTextColor: '#303133',
  scrollbarBackground: 'rgba(24, 144, 255, 0.5)',
  scrollbarThumbBackground: 'rgba(24, 144, 255, 0.5)',
  scrollbarThumbHoverBackground: 'rgba(24, 144, 255, 0.8)',
  bufferRows: 5,
  minAutoColWidth: 100,
  sortActiveColor: '#409EFF',
  chartHeight: 360,
  chartWidth: 1500,
  bodyRowHeight: 32,
  dragIconHeight: 16,
  dragIconWidth: 9
})

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

<style scoped>
.table-demo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-bottom: 32px;
}

.perf-panel {
  width: min(1500px, 100%);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #dbe7f3;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.perf-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.perf-runtime {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: #475569;
  font-size: 13px;
}

.perf-toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.perf-section + .perf-section {
  margin-top: 16px;
}

.perf-section-title {
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}

.perf-overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.perf-overview-card {
  padding: 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.perf-overview-label {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 6px;
}

.perf-overview-value {
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.perf-overview-meta {
  color: #475569;
  font-size: 12px;
}

.perf-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.perf-metric-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  overflow: hidden;
}

.perf-metric-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.perf-metric-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.perf-metric-subtitle {
  color: #64748b;
  font-size: 12px;
  margin-top: 2px;
}

.perf-metric-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.perf-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
}

.perf-metric-values {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #475569;
  font-size: 12px;
  margin-bottom: 10px;
}

.perf-meter {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  margin-bottom: 10px;
}

.perf-meter-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22c55e 0%, #f59e0b 60%, #ef4444 100%);
}

.perf-sparkline {
  width: 100%;
  height: 84px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding-top: 6px;
  overflow: hidden;
}

.perf-sparkline-bar {
  flex: 1 1 0;
  min-width: 0;
  border-radius: 999px 999px 0 0;
  background: #93c5fd;
}

.perf-sparkline-bar.is-warning {
  background: #fbbf24;
}

.perf-sparkline-bar.is-danger {
  background: #f87171;
}

@media (max-width: 900px) {
  .perf-toolbar {
    flex-direction: column;
  }
}
</style>
