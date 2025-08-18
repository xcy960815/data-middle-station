<template>
  <ClientOnly>
    <el-form label-width="auto" :model="tableConfig">
      <el-form-item label="是否行高亮">
        <el-switch v-model="tableConfig.enableRowHoverHighlight" />
      </el-form-item>
      <el-form-item label="是否列高亮">
        <el-switch v-model="tableConfig.enableColHoverHighlight" />
      </el-form-item>
      <el-form-item label="是否显示边框">
        <el-switch v-model="tableConfig.border" />
      </el-form-item>
      <el-form-item label="高亮 cell 背景色">
        <el-color-picker v-model="tableConfig.highlightCellBackground" />
      </el-form-item>
      <el-form-item label="表头高度">
        <el-input-number v-model="tableConfig.headerHeight" :min="10" :max="100" :step="10" />
      </el-form-item>
      <el-form-item label="表头字体大小">
        <el-input-number v-model="tableConfig.headerFontSize" :min="10" :max="100" :step="10" />
      </el-form-item>
      <el-form-item label="表头字体">
        <el-select style="width: 200px" v-model="tableConfig.headerFontFamily" placeholder="请选择表头字体">
          <el-option v-for="item in fontFamilyOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="表头文本颜色">
        <el-color-picker v-model="tableConfig.headerTextColor" />
      </el-form-item>
      <el-form-item label="表头背景色">
        <el-color-picker v-model="tableConfig.headerBackground" />
      </el-form-item>
      <el-form-item label="表格文本颜色">
        <el-color-picker v-model="tableConfig.bodyTextColor" />
      </el-form-item>
      <el-form-item label="表格奇数行背景色">
        <el-color-picker v-model="tableConfig.bodyBackgroundOdd" />
      </el-form-item>
      <el-form-item label="表格偶数行背景色">
        <el-color-picker v-model="tableConfig.bodyBackgroundEven" />
      </el-form-item>
      <el-form-item label="表格边框颜色">
        <el-color-picker v-model="tableConfig.borderColor" />
      </el-form-item>
      <el-form-item label="滚动条背景色">
        <el-color-picker v-model="tableConfig.scrollbarBackground" />
      </el-form-item>
      <el-form-item label="滚动条滑块颜色">
        <el-color-picker v-model="tableConfig.scrollbarThumb" />
      </el-form-item>
      <el-form-item label="滚动条滑块悬停颜色">
        <el-color-picker v-model="tableConfig.scrollbarThumbHover" />
      </el-form-item>

      <el-form-item label="是否展示汇总">
        <el-switch v-model="tableConfig.enableSummary" />
      </el-form-item>
      <el-form-item label="汇总高度">
        <el-input-number v-model="tableConfig.summaryHeight" :min="10" :max="100" :step="10" />
      </el-form-item>
    </el-form>
    <CanvasTable
      :enable-summary="tableConfig.enableSummary"
      :summary-height="tableConfig.summaryHeight"
      chart-height="90%"
      chart-width="100%"
      :x-axis-fields="xAxisFields"
      :header-text-color="tableConfig.headerTextColor"
      :body-text-color="tableConfig.bodyTextColor"
      :header-font-family="tableConfig.headerFontFamily"
      :header-font-size="tableConfig.headerFontSize"
      :header-height="tableConfig.headerHeight"
      :body-font-family="tableConfig.bodyFontFamily"
      :body-font-size="tableConfig.bodyFontSize"
      :summary-font-family="tableConfig.summaryFontFamily"
      :summary-font-size="tableConfig.summaryFontSize"
      :header-background="tableConfig.headerBackground"
      :summary-background="tableConfig.summaryBackground"
      :body-background-odd="tableConfig.bodyBackgroundOdd"
      :body-background-even="tableConfig.bodyBackgroundEven"
      :border-color="tableConfig.borderColor"
      :scrollbar-background="tableConfig.scrollbarBackground"
      :scrollbar-thumb="tableConfig.scrollbarThumb"
      :scrollbar-thumb-hover="tableConfig.scrollbarThumbHover"
      :buffer-rows="tableConfig.bufferRows"
      :min-auto-col-width="tableConfig.minAutoColWidth"
      :scroll-threshold="tableConfig.scrollThreshold"
      :header-sort-active-background="tableConfig.headerSortActiveBackground"
      :sortable-color="tableConfig.sortableColor"
      :y-axis-fields="yAxisFields"
      :enable-row-hover-highlight="tableConfig.enableRowHoverHighlight"
      :enable-col-hover-highlight="tableConfig.enableColHoverHighlight"
      :border="tableConfig.border"
      :data="data"
      :span-method="spanMethod"
      @cell-click="handleCellClick"
    >
    </CanvasTable>
  </ClientOnly>
</template>

<script setup lang="ts">
import CanvasTable from '@/components/table-chart/canvas-table.vue'
const enableSummary = ref(true)
const spanMethod = ({
  rowIndex,
  colIndex
}: {
  row: ChartDataDao.ChartData[0]
  column: GroupStore.GroupOption | DimensionStore.DimensionOption
  rowIndex: number
  colIndex: number
}): { rowspan: number; colspan: number } => {
  if (colIndex === 0) {
    if (rowIndex % 2 === 0) {
      return { rowspan: 2, colspan: 1 }
    } else {
      return { rowspan: 0, colspan: 0 }
    }
  }
  return { rowspan: 1, colspan: 1 }
}
/**
 * 分组列
 */
const xAxisFields = ref<GroupStore.GroupOption[]>([])

/**
 * 维度列
 */
const yAxisFields = ref<DimensionStore.DimensionOption[]>([
  {
    columnName: 'id',
    columnType: 'number',
    columnComment: 'id',
    displayName: 'id',
    width: 200,
    filterable: true,
    fixed: 'left' as const
  },
  {
    columnName: 'name',
    columnType: 'string',
    columnComment: 'name',
    displayName: 'name'
  },
  {
    columnName: 'age',
    columnType: 'number',
    columnComment: 'age',
    displayName: 'age',
    fixed: 'left' as const
  },
  {
    columnName: 'gender',
    columnType: 'string',
    columnComment: 'gender',
    filterable: true,
    sortable: true,
    displayName: 'gender'
  },
  {
    columnName: 'country',
    columnType: 'string',
    columnComment: 'country',
    width: 200,
    filterable: true,
    sortable: true,
    displayName: 'country',
    fixed: 'left' as const
  },
  {
    columnName: 'city',
    columnType: 'string',
    columnComment: 'city',
    width: 200,
    filterable: true,
    sortable: true,
    displayName: 'city',
    fixed: 'left' as const
  },
  {
    columnName: 'state',
    columnType: 'string',
    columnComment: 'state',
    displayName: 'state'
  },
  {
    columnName: 'zipcode',
    columnType: 'number',
    columnComment: 'zipcode',
    displayName: 'zipcode',
    width: 200,
    fixed: 'right' as const
  },
  {
    columnName: 'address',
    columnType: 'string',
    columnComment: 'address',
    displayName: 'address',
    showOverflowTooltip: true,
    width: 200
  },
  {
    columnName: 'phone',
    columnType: 'string',
    columnComment: 'phone',
    displayName: 'phone',
    width: 200
  },
  {
    columnName: 'mobile',
    columnType: 'string',
    columnComment: 'mobile',
    displayName: 'mobile'
  }
])

/**
 * 数据
 */
const data: ChartDataDao.ChartData = Array.from({ length: 3000 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  age: 18 + ((i * 7) % 40),
  gender: ['Male', 'Female', 'Other'][(i * 3) % 3],
  country: ['China', 'USA', 'UK', 'Germany', 'France', 'Japan', 'Canada', 'Australia'][(i * 3) % 8],
  city: ['Beijing', 'Shanghai', 'New York', 'London', 'Berlin', 'Paris', 'Tokyo', 'Toronto', 'Sydney'][(i * 5) % 9],
  state: ['CA', 'NY', 'TX', 'FL', 'WA', 'IL', 'PA', 'OH', 'GA', 'NC'][(i * 7) % 10],
  zipcode: `${10000 + ((i * 123) % 90000)}`,
  address: `${i + 1} Main Street, Apt ${(i % 50) + 1}--${i + 1} Main Street, Apt ${(i % 50) + 1}---${i + 1} Main Street, Apt ${(i % 50) + 1}`,
  phone: `+1-555-${String(1000 + i).slice(-4)}`,
  mobile: `+1-666-${String(2000 + i).slice(-4)}`,
  company: ['TechCorp', 'DataSoft', 'CloudInc', 'WebSolutions', 'AppDev', 'SystemsLtd', 'CodeWorks', 'DigitalPro'][
    (i * 11) % 8
  ],
  department: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Support', 'Design'][(i * 13) % 8],
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
  notes: `Additional notes for user ${i + 1}. Lorem ipsum dolor sit amet.`,
  email: `user${i + 1}@${['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'example.org'][(i * 29) % 5]}`
}))
/**
 * 单元格点击事件
 */
const handleCellClick = (cell: { rowIndex: number; colIndex: number }) => {
  console.log('Cell clicked:', cell)
}

const tableConfig = reactive({
  enableSummary: false,
  summaryHeight: 32,
  enableRowHoverHighlight: false,
  enableColHoverHighlight: false,
  border: false,
  highlightCellBackground: 'rgba(24, 144, 255, 0.12)',
  headerHeight: 32,
  headerTextColor: '#303133',
  headerFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  headerFontSize: 14,
  headerBackground: '#fafafa', // 新增
  bodyTextColor: '#374151', // 新增
  bodyBackgroundOdd: '#ffffff', // 新增
  bodyBackgroundEven: '#fafafa', // 新增
  borderColor: '#e5e7eb', // 新增
  bodyFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  bodyFontSize: 13,
  summaryFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  summaryFontSize: 14,
  summaryBackground: '#f7f7f9',
  summaryTextColor: '#303133',
  scrollbarBackground: '#f1f1f1',
  scrollbarThumb: '#c1c1c1',
  scrollbarThumbHover: '#a8a8a8',
  bufferRows: 5,
  minAutoColWidth: 100,
  scrollThreshold: 10,
  headerSortActiveBackground: '#ecf5ff',
  sortableColor: '#409EFF'
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
.stage-container {
  height: 460px;
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #fff;
}
</style>
