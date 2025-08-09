<template>
  <ClientOnly>
    <table-chart :columns="columns" :data="data" @cell-click="handleCellClick" />
  </ClientOnly>
</template>

<script setup lang="ts">
type PinDirection = 'left' | 'right' | null | undefined

interface RowData {
  [key: string]: string | number
}

/**
 * 表头配置
 * key: 列的唯一标识
 * title: 列的标题
 * width: 列的宽度
 * fixed: 列是否固定，固定在左侧或右侧
 * align: 列的对齐方式
 */
const columns = [
  { key: 'id', title: 'ID', width: 80, fixed: 'left' as const, align: 'right' as const },
  { key: 'name', title: 'Name' },
  { key: 'age', title: 'Age', width: 80, align: 'right' as const },
  { key: 'gender', title: 'Gender', width: 80 },
  { key: 'country', title: 'Country' },
  { key: 'city', title: 'City' },
  { key: 'state', title: 'State', width: 100 },
  { key: 'zipcode', title: 'Zip Code', width: 100 },
  { key: 'address', title: 'Address', width: 200 },
  { key: 'phone', title: 'Phone', width: 140 },
  { key: 'mobile', title: 'Mobile', width: 140 },
  { key: 'company', title: 'Company', width: 150 },
  { key: 'department', title: 'Department' },
  { key: 'position', title: 'Position', width: 130 },
  { key: 'salary', title: 'Salary', width: 100, align: 'right' as const },
  { key: 'experience', title: 'Experience', width: 100, align: 'right' as const },
  { key: 'education', title: 'Education' },
  { key: 'skills', title: 'Skills', width: 180 },
  { key: 'notes', title: 'Notes', width: 200, fixed: 'right' as const },
  { key: 'email', title: 'Email', width: 220, fixed: 'right' as const }
]

/**
 * 数据
 */
const data: RowData[] = Array.from({ length: 30000 }, (_, i) => ({
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

const handleCellClick = (cell: any) => {
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
