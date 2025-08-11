<template>
  <ClientOnly>
    <CanvasTable
      :show-overflow-tooltip="true"
      chart-height="500px"
      chart-width="100%"
      :x-axis-fields="xAxisFields"
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

// 示例：第 0 列（ID）每两行纵向合并一次
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
      const remaining = data.length - rowIndex
      return { rowspan: remaining >= 2 ? 2 : 1, colspan: 1 }
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
    columnType: 'int',
    columnComment: 'ID',
    alias: 'id',
    displayName: 'ID',
    width: 200,
    filterable: true,
    fixed: 'left' as const
  },
  {
    columnName: 'name',
    columnType: 'varchar',
    columnComment: 'Name',
    alias: 'name',
    displayName: 'Name'
  },
  {
    columnName: 'age',
    columnType: 'int',
    columnComment: 'Age',
    alias: 'age',
    displayName: 'Age',
    fixed: 'left' as const
  },
  {
    columnName: 'gender',
    columnType: 'varchar',
    columnComment: 'Gender',
    alias: 'gender',
    filterable: true,
    displayName: 'Gender'
  },
  {
    columnName: 'country',
    columnType: 'varchar',
    columnComment: 'Country',
    alias: 'country',
    width: 200,
    filterable: true,
    displayName: 'Country',
    fixed: 'left' as const
  },
  {
    columnName: 'city',
    columnType: 'varchar',
    columnComment: 'City',
    alias: 'city',
    width: 200,
    filterable: true,
    displayName: 'City',
    fixed: 'left' as const
  },
  {
    columnName: 'state',
    columnType: 'varchar',
    columnComment: 'State',
    alias: 'state',
    displayName: '状态'
  },
  {
    columnName: 'zipcode',
    columnType: 'varchar',
    columnComment: 'Zipcode',
    alias: 'zipcode',
    displayName: 'Zipcode',
    width: 200,
    fixed: 'right' as const
  },
  {
    columnName: 'address',
    columnType: 'varchar',
    columnComment: 'Address',
    alias: 'address',
    displayName: 'Address',
    showOverflowTooltip: true,
    width: 200
  },
  {
    columnName: 'phone',
    columnType: 'varchar',
    columnComment: 'Phone',
    alias: 'phone',
    displayName: 'Phone',
    width: 200
  },
  {
    columnName: 'mobile',
    columnType: 'varchar',
    columnComment: 'Mobile',
    alias: 'mobile',
    // showOverflowTooltip: true,
    displayName: 'Mobile'
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
