<template>
  <ClientOnly>
    <table-chart :columns="columns" :data="data" />
  </ClientOnly>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })
import { onBeforeUnmount, onMounted, ref } from 'vue'

type PinDirection = 'left' | 'right' | null

interface ColumnDef {
  key: string
  title: string
  width: number
  pin: PinDirection
  align?: 'left' | 'center' | 'right'
}

interface RowData {
  [key: string]: string | number
}

const containerRef = ref<HTMLDivElement | null>(null)

/**
 * 表头配置
 * key: 列的唯一标识
 * title: 列的标题
 * width: 列的宽度
 * pin: 列是否固定，固定在左侧或右侧
 * align: 列的对齐方式
 */
const columns: ColumnDef[] = [
  { key: 'id', title: 'ID', width: 80, pin: 'left', align: 'right' },
  { key: 'name', title: 'Name', width: 120, pin: null },
  { key: 'age', title: 'Age', width: 80, pin: null, align: 'right' },
  { key: 'gender', title: 'Gender', width: 80, pin: null },
  { key: 'country', title: 'Country', width: 120, pin: null },
  { key: 'city', title: 'City', width: 120, pin: null },
  { key: 'state', title: 'State', width: 100, pin: null },
  { key: 'zipcode', title: 'Zip Code', width: 100, pin: null },
  { key: 'address', title: 'Address', width: 200, pin: null },
  { key: 'phone', title: 'Phone', width: 140, pin: null },
  { key: 'mobile', title: 'Mobile', width: 140, pin: null },
  { key: 'company', title: 'Company', width: 150, pin: null },
  { key: 'department', title: 'Department', width: 120, pin: null },
  { key: 'position', title: 'Position', width: 130, pin: null },
  { key: 'salary', title: 'Salary', width: 100, pin: null, align: 'right' },
  { key: 'experience', title: 'Experience', width: 100, pin: null, align: 'right' },
  { key: 'education', title: 'Education', width: 120, pin: null },
  { key: 'skills', title: 'Skills', width: 180, pin: null },
  { key: 'notes', title: 'Notes', width: 200, pin: 'right' },
  { key: 'email', title: 'Email', width: 220, pin: 'right' }
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
</script>

<style scoped>
.stage-container {
  height: 460px;
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #fff;
}
</style>
