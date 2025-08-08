<template>
  <div class="table-demo">
    <div class="demo-header">
      <h1>Canvas 表格功能演示</h1>
      <p>演示列宽控制、固定列功能和分页展示（共11列数据）</p>
    </div>

    <div class="demo-controls">
      <el-switch
        v-model="enableEqualWidth"
        active-text="启用平均分宽度"
        inactive-text="按内容自适应"
        @change="handleWidthModeChange"
      />
      <span class="current-mode">当前模式: {{ enableEqualWidth ? '平均分宽度' : '内容自适应' }}</span>

      <el-divider direction="vertical" />

      <div class="fixed-columns-control">
        <span>固定列配置:</span>
        <el-input-number
          v-model="fixedColumns.left"
          :min="0"
          :max="11"
          size="small"
          placeholder="左侧"
          style="width: 80px; margin: 0 8px"
        />
        <span>列</span>
        <el-input-number
          v-model="fixedColumns.right"
          :min="0"
          :max="11"
          size="small"
          placeholder="右侧"
          style="width: 80px; margin: 0 8px"
        />
        <span>列</span>
      </div>
    </div>

    <div class="table-container">
      <CanvasTable
        :data="tableData"
        :xAxisFields="xAxisFields"
        :yAxisFields="yAxisFields"
        :chartHeight="tableHeight"
        :chartWidth="tableWidth"
        :enableEqualWidth="enableEqualWidth"
        :fixedColumns="fixedColumns"
        :chartConfig="getTableConfig()"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue'
import CanvasTable from '~/components/table-chart/index.vue'

// 列宽模式
const enableEqualWidth = ref(true)

// 固定列配置
const fixedColumns = ref({
  left: 2, // 固定姓名和年龄列
  right: 2 // 固定职级和直属领导列
})

// 表格尺寸
const tableWidth = ref(0)
const tableHeight = ref(0)

// 表格数据
const tableData = ref<ChartDataDao.ChartData>([
  {
    name: '张三',
    age: 25,
    salary: 8000,
    department: '技术部',
    performance: 85,
    email: 'zhangsan@company.com',
    phone: '13800138001',
    address: '北京市朝阳区',
    joinDate: '2020-03-15',
    level: 'P5',
    manager: '李经理'
  },
  {
    name: '李四',
    age: 30,
    salary: 12000,
    department: '产品部',
    performance: 92,
    email: 'lisi@company.com',
    phone: '13800138002',
    address: '上海市浦东新区',
    joinDate: '2019-07-20',
    level: 'P6',
    manager: '王总监'
  },
  {
    name: '王五',
    age: 28,
    salary: 9500,
    department: '设计部',
    performance: 78,
    email: 'wangwu@company.com',
    phone: '13800138003',
    address: '深圳市南山区',
    joinDate: '2021-01-10',
    level: 'P5',
    manager: '张经理'
  },
  {
    name: '赵六',
    age: 35,
    salary: 15000,
    department: '运营部',
    performance: 88,
    email: 'zhaoliu@company.com',
    phone: '13800138004',
    address: '广州市天河区',
    joinDate: '2018-11-05',
    level: 'P7',
    manager: '陈总监'
  },
  {
    name: '钱七',
    age: 26,
    salary: 8500,
    department: '市场部',
    performance: 95,
    email: 'qianqi@company.com',
    phone: '13800138005',
    address: '杭州市西湖区',
    joinDate: '2020-09-12',
    level: 'P5',
    manager: '刘经理'
  },
  {
    name: '孙八',
    age: 32,
    salary: 11000,
    department: '技术部',
    performance: 87,
    email: 'sunba@company.com',
    phone: '13800138006',
    address: '成都市高新区',
    joinDate: '2019-12-03',
    level: 'P6',
    manager: '李经理'
  },
  {
    name: '周九',
    age: 29,
    salary: 9000,
    department: '产品部',
    performance: 83,
    email: 'zhoujiu@company.com',
    phone: '13800138007',
    address: '武汉市东湖高新区',
    joinDate: '2021-06-18',
    level: 'P5',
    manager: '王总监'
  },
  {
    name: '吴十',
    age: 27,
    salary: 8800,
    department: '设计部',
    performance: 90,
    email: 'wushi@company.com',
    phone: '13800138008',
    address: '西安市雁塔区',
    joinDate: '2020-08-25',
    level: 'P5',
    manager: '张经理'
  },
  {
    name: '郑十一',
    age: 31,
    salary: 13500,
    department: '技术部',
    performance: 91,
    email: 'zhengshiyi@company.com',
    phone: '13800138009',
    address: '南京市建邺区',
    joinDate: '2019-04-30',
    level: 'P6',
    manager: '李经理'
  },
  {
    name: '王十二',
    age: 33,
    salary: 16000,
    department: '产品部',
    performance: 89,
    email: 'wangshier@company.com',
    phone: '13800138010',
    address: '重庆市渝北区',
    joinDate: '2018-06-15',
    level: 'P7',
    manager: '王总监'
  },
  {
    name: '刘十三',
    age: 24,
    salary: 7500,
    department: '设计部',
    performance: 82,
    email: 'liushisan@company.com',
    phone: '13800138011',
    address: '天津市和平区',
    joinDate: '2021-03-22',
    level: 'P4',
    manager: '张经理'
  },
  {
    name: '陈十四',
    age: 36,
    salary: 18000,
    department: '运营部',
    performance: 94,
    email: 'chenshisi@company.com',
    phone: '13800138012',
    address: '苏州市工业园区',
    joinDate: '2017-09-08',
    level: 'P8',
    manager: '陈总监'
  }
])

// 字段配置
const xAxisFields = ref<GroupStore.GroupOption[]>([
  { columnName: 'name', displayName: '姓名', columnType: 'varchar', columnComment: '用户姓名', alias: 'name' },
  { columnName: 'age', displayName: '年龄', columnType: 'int', columnComment: '用户年龄', alias: 'age' },
  { columnName: 'email', displayName: '邮箱', columnType: 'varchar', columnComment: '工作邮箱', alias: 'email' },
  { columnName: 'phone', displayName: '电话', columnType: 'varchar', columnComment: '联系电话', alias: 'phone' }
])

const yAxisFields = ref<DimensionStore.DimensionOption[]>([
  { columnName: 'salary', displayName: '薪资', columnType: 'decimal', columnComment: '月薪', alias: 'salary' },
  {
    columnName: 'department',
    displayName: '部门',
    columnType: 'varchar',
    columnComment: '所属部门',
    alias: 'department'
  },
  {
    columnName: 'performance',
    displayName: '绩效',
    columnType: 'decimal',
    columnComment: '绩效评分',
    alias: 'performance'
  },
  { columnName: 'address', displayName: '地址', columnType: 'varchar', columnComment: '居住地址', alias: 'address' },
  { columnName: 'joinDate', displayName: '入职日期', columnType: 'date', columnComment: '入职时间', alias: 'joinDate' },
  { columnName: 'level', displayName: '职级', columnType: 'varchar', columnComment: '员工职级', alias: 'level' },
  { columnName: 'manager', displayName: '直属领导', columnType: 'varchar', columnComment: '直接上级', alias: 'manager' }
])

/**
 * @desc 处理宽度模式变化
 */
const handleWidthModeChange = () => {
  console.log('列宽模式已切换:', enableEqualWidth.value ? '平均分宽度' : '内容自适应')
}

/**
 * @desc 获取表格配置（包含条件格式）
 */
const getTableConfig = () => {
  return {
    conditions: [
      {
        conditionType: '单色',
        conditionField: 'salary',
        conditionSymbol: 'gt',
        conditionValue: 12000,
        conditionColor: '#67c23a'
      },
      {
        conditionType: '单色',
        conditionField: 'salary',
        conditionSymbol: 'lt',
        conditionValue: 9000,
        conditionColor: '#f56c6c'
      },
      {
        conditionType: '单色',
        conditionField: 'performance',
        conditionSymbol: 'gt',
        conditionValue: 90,
        conditionColor: '#409eff'
      }
    ]
  }
}

/**
 * @desc 计算表格尺寸
 */
const calculateTableSize = () => {
  const container = document.querySelector('.table-demo .table-container')
  if (container) {
    tableWidth.value = container.clientWidth
    tableHeight.value = container.clientHeight
    console.log('表格尺寸:', tableWidth.value, tableHeight.value)
  }
}

onMounted(() => {
  // 延迟计算表格尺寸，确保DOM已渲染
  nextTick(() => {
    calculateTableSize()
  })

  // 监听窗口大小变化
  window.addEventListener('resize', calculateTableSize)
})
</script>

<style scoped lang="scss">
.table-demo {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f5f7fa;

  .demo-header {
    margin-bottom: 20px;
    text-align: center;

    h1 {
      color: #303133;
      margin-bottom: 10px;
      font-size: 24px;
    }

    p {
      color: #606266;
      font-size: 14px;
    }
  }

  .demo-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .current-mode {
      margin-left: auto;
      color: #409eff;
      font-weight: 500;
    }

    .fixed-columns-control {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .table-container {
    flex: 1;
    min-height: 400px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: auto;
  }
}
</style>
