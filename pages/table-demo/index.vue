<template>
  <div class="table-demo-container">
    <el-form label-width="auto" :model="tableConfig" inline>
      <el-form-item label="是否行高亮">
        <el-switch v-model="tableConfig.enableRowHoverHighlight" />
      </el-form-item>
      <el-form-item label="是否列高亮">
        <el-switch v-model="tableConfig.enableColHoverHighlight" />
      </el-form-item>
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
    <client-only>
      <CanvasTable
        :enable-summary="tableConfig.enableSummary"
        :summary-height="tableConfig.summaryRowHeight"
        :chart-height="tableConfig.chartHeight"
        :chart-width="tableConfig.chartWidth"
        :x-axis-fields="xAxisFields"
        :highlight-cell-background="tableConfig.highlightCellBackground"
        :header-text-color="tableConfig.headerTextColor"
        :body-text-color="tableConfig.bodyTextColor"
        :header-font-family="tableConfig.headerFontFamily"
        :header-font-size="tableConfig.headerFontSize"
        :header-height="tableConfig.headerRowHeight"
        :body-font-family="tableConfig.bodyFontFamily"
        :body-font-size="tableConfig.bodyFontSize"
        :summary-font-family="tableConfig.summaryFontFamily"
        :summary-font-size="tableConfig.summaryFontSize"
        :header-background="tableConfig.headerBackground"
        :summary-background="tableConfig.summaryBackground"
        :body-background-odd="tableConfig.bodyBackgroundOdd"
        :body-background-even="tableConfig.bodyBackgroundEven"
        :scrollbar-background="tableConfig.scrollbarBackground"
        :scrollbar-thumb="tableConfig.scrollbarThumbBackground"
        :scrollbar-thumb-hover="tableConfig.scrollbarThumbHoverBackground"
        :buffer-rows="tableConfig.bufferRows"
        :min-auto-col-width="tableConfig.minAutoColWidth"
        :sort-active-color="tableConfig.sortActiveColor"
        :y-axis-fields="yAxisFields"
        :enable-row-hover-highlight="tableConfig.enableRowHoverHighlight"
        :enable-col-hover-highlight="tableConfig.enableColHoverHighlight"
        :data="data"
        :highlight-row-background="tableConfig.highlightRowBackground"
        :highlight-col-background="tableConfig.highlightColBackground"
        :drag-icon-height="tableConfig.dragIconHeight"
        :drag-icon-width="tableConfig.dragIconWidth"
        :drag-icon-dot-size="4"
        :span-method="spanMethod"
      >
      </CanvasTable>
    </client-only>
  </div>
</template>

<script setup lang="ts">
// import TableChart from '@/components/table-chart/index.vue'
import CanvasTable from '@/components/table-chart/canvas-table.vue'

// 合并单元格配置
const spanConfig = reactive({
  enableSpan: true,
  firstColSpan: 3, // 第一列合并行数
  secondColSpan: 2, // 第二列合并行数
  enableColSpan: false // 是否启用列合并
})

const spanMethod = ({
  row,
  column,
  rowIndex,
  colIndex
}: {
  row: ChartDataVo.ChartData
  column: GroupStore.GroupOption | DimensionStore.DimensionOption
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
 * 分组列
 */
const xAxisFields = ref<GroupStore.GroupOption[]>([])

/**
 * 维度列
 */
const yAxisFields = ref<DimensionStore.DimensionOption[]>([
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
    width: 200,
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
    width: 200,
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
    width: 200,
    sortable: true,
    editable: true,
    editType: 'input'
  },
  {
    columnName: 'gender',
    columnType: 'string',
    columnComment: 'gender',
    width: 200,
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
    width: 200,
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
    width: 200,
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
    editable: true,
    editType: 'input'
  },
  {
    columnName: 'zipcode',
    columnType: 'number',
    columnComment: 'zipcode',
    displayName: 'zipcode',
    width: 200,
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
    showOverflowTooltip: true,
    width: 200,
    editable: true,
    editType: 'input'
  },
  {
    columnName: 'phone',
    columnType: 'string',
    columnComment: 'phone',
    displayName: 'phone',
    width: 200,
    editable: true,
    editType: 'input'
  },
  {
    columnName: 'mobile',
    columnType: 'string',
    width: 200,
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
    width: 150,
    editable: true,
    editType: 'date'
  },
  {
    columnName: 'lastLogin',
    columnType: 'datetime',
    columnComment: '最后登录时间',
    displayName: '最后登录时间',
    width: 180,
    editable: true,
    editType: 'datetime',
    fixed: 'right' as const
  }
])

/**
 * 数据
 */
const data: Array<ChartDataVo.ChartData> = Array.from({ length: 1000 }, (_, i) => {
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
    age: 18 + i,
    gender: ['Male', 'Female', 'Other'][(i * 3) % 3],
    country: ['China', 'USA', 'UK', 'Germany', 'France', 'Japan', 'Canada', 'Australia'][(i * 3) % 8],
    city: ['Beijing', 'Shanghai', 'New York', 'London', 'Berlin', 'Paris', 'Tokyo', 'Toronto', 'Sydney'][(i * 5) % 9],
    state: ['CA', 'NY', 'TX', 'FL', 'WA', 'IL', 'PA', 'OH', 'GA', 'NC'][(i * 7) % 10],
    zipcode: `${10000 + ((i * 123) % 90000)}`,
    address: `${i + 1} Main Street, Apt ${(i % 50) + 1}--${i + 1} Main Street, Apt ${(i % 50) + 1}---${i + 1} Main Street, Apt ${(i % 50) + 1}`,
    phone: `+1-555-${String(1000 + i).slice(-4)}`,
    mobile: `+1-666-${String(2000 + i).slice(-4)}`,
    birthday,
    lastLogin,
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
  }
})

const tableConfig = reactive({
  enableSummary: true,
  summaryRowHeight: 32,
  enableRowHoverHighlight: false,
  enableColHoverHighlight: false,
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
}
</style>
