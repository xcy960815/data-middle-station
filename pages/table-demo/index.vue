<template>
  <ClientOnly>
    <CanvasTable
      chart-height="500px"
      chart-width="100%"
      :x-axis-fields="xAxisFields"
      :y-axis-fields="yAxisFields"
      :enable-row-hover-highlight="true"
      :enable-col-hover-highlight="true"
      :data="data"
      @cell-click="handleCellClick"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import CanvasTable from '@/components/table-chart/canvas-table.vue'
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
    displayName: 'Gender'
  },
  {
    columnName: 'country',
    columnType: 'varchar',
    columnComment: 'Country',
    alias: 'country',
    width: 200,
    displayName: 'Country',
    fixed: 'left' as const
  },
  {
    columnName: 'city',
    columnType: 'varchar',
    columnComment: 'City',
    alias: 'city',
    width: 200,
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
