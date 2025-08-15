<template>
  <ClientOnly>
    <CanvasTable
      :enable-summary="true"
      chart-height="500px"
      chart-width="100%"
      :x-axis-fields="xAxisFields"
      header-background="red"
      summary-background="yellow"
      :y-axis-fields="yAxisFields"
      :enable-row-hover-highlight="true"
      :enable-col-hover-highlight="true"
      :data="data"
      :span-method="spanMethod"
      @cell-click="handleCellClick"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import CanvasTable from '@/components/table-chart/canvas-table.vue'

const spanMethod = ({
  rowIndex,
  colIndex
}: {
  row: ChartDataDao.ChartData[0]
  column: GroupStore.GroupOption | DimensionStore.DimensionOption
  rowIndex: number
  colIndex: number
}): { rowspan: number; colspan: number } => {
  // if (colIndex === 0) {
  //   if (rowIndex % 2 === 0) {
  //     const remaining = data.length - rowIndex
  //     return { rowspan: remaining >= 2 ? 2 : 1, colspan: 1 }
  //   } else {
  //     return { rowspan: 0, colspan: 0 }
  //   }
  // }
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
    alias: 'id',
    displayName: 'id',
    width: 200,
    filterable: true,
    fixed: 'left' as const
  },
  {
    columnName: 'name',
    columnType: 'string',
    columnComment: 'name',
    alias: 'name',
    displayName: 'name'
  },
  {
    columnName: 'age',
    columnType: 'number',
    columnComment: 'age',
    alias: 'age',
    displayName: 'age',
    fixed: 'left' as const
  },
  {
    columnName: 'gender',
    columnType: 'string',
    columnComment: 'gender',
    alias: 'gender',
    filterable: true,
    sortable: true,
    displayName: 'gender'
  },
  {
    columnName: 'country',
    columnType: 'string',
    columnComment: 'country',
    alias: 'country',
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
    alias: 'city',
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
    alias: 'state',
    displayName: 'state'
  },
  {
    columnName: 'zipcode',
    columnType: 'number',
    columnComment: 'zipcode',
    alias: 'zipcode',
    displayName: 'zipcode',
    width: 200,
    fixed: 'right' as const
  },
  {
    columnName: 'address',
    columnType: 'string',
    columnComment: 'address',
    alias: 'address',
    displayName: 'address',
    showOverflowTooltip: true,
    width: 200
  },
  {
    columnName: 'phone',
    columnType: 'string',
    columnComment: 'phone',
    alias: 'phone',
    displayName: 'phone',
    width: 200
  },
  {
    columnName: 'mobile',
    columnType: 'string',
    columnComment: 'mobile',
    alias: 'mobile',
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
</script>

<style scoped>
.stage-container {
  height: 460px;
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #fff;
}
</style>
