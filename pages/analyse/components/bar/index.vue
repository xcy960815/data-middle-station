<template>
  <div class="bar relative flex">
    <el-button link @click="handleClickRefresh" class="mr-auto"> 刷新 </el-button>
    <el-button link @click="handleClickAlarm">报警</el-button>
    <el-button link @click="handleClickSetting">设置</el-button>
    <el-button link @click="handleClickFullScreen">全屏</el-button>
    <el-button link @click="handleClickDownload">下载</el-button>
    <el-button link @click="handleAnalyse">保存</el-button>
    <el-tag v-show="chartUpdateTakesTime" size="small" class="pr-[10px] ml-[10px]" type="info"
      >更新耗时 ：{{ chartUpdateTakesTime }}</el-tag
    >
    <el-tag v-show="chartUpdateTime" size="small" class="pr-[10px] ml-[10px]" type="info"
      >更新时间 ：{{ chartUpdateTime }}</el-tag
    >
  </div>
</template>

<script setup lang="ts">
import { ElButton, ElCheckbox, ElCheckboxGroup, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { getChartDataHandler } from '../../getChartData'
import { updateAnalyseHandler } from '../../updateAnalyse'
const { queryChartData } = getChartDataHandler()
const { handleUpdateAnalyse } = updateAnalyseHandler()
const analyseStore = useAnalyseStore()
const columnStore = useColumnStore()
const chartConfigStore = useChartConfigStore()
const dimensionStore = useDimensionStore()
const groupStore = useGroupStore()
const chartUpdateTime = computed(() => analyseStore.getChartUpdateTime)
const chartUpdateTakesTime = computed(() => analyseStore.getChartUpdateTakesTime)
/**
 * @desc 点刷新按钮
 * @returns void
 */
const handleClickRefresh = () => {
  queryChartData()
}
/**
 * @desc 点报警按钮
 * @returns void
 */
const handleClickAlarm = () => {
  console.log('handleClickAlarm')
}
/**
 * @desc 点设置按钮
 * @returns void
 */
const handleClickSetting = () => {
  chartConfigStore.setChartConfigDrawer(true)
}
/**
 * @desc 点全屏按钮
 * @returns void
 */
const handleClickFullScreen = () => {
  console.log('handleClickFullScreen')
}

/**
 * @desc 点保存按钮
 * @returns void
 */
const handleAnalyse = () => {
  // 给用户提示
  ElMessageBox({
    title: '请确认',
    message: h('div', [
      '确认保存分析',
      h(
        'span',
        {
          style: {
            color: '#409eff',
            fontWeight: 'bold',
            backgroundColor: '#ecf5ff',
            padding: '2px 6px',
            borderRadius: '4px',
            margin: '0 4px'
          }
        },
        analyseStore.getAnalyseName
      ),
      '吗？'
    ]),
    showCancelButton: true,
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  })
    .then(() => {
      handleUpdateAnalyse()
    })
    .catch(() => {
      ElMessage.info('取消保存')
    })
}

/**
 * @desc 点下载按钮
 * @returns void
 */
const handleClickDownload = () => {
  // 获取所有的维度和分组
  const feilds = dimensionStore.getDimensions.concat(groupStore.getGroups)
  if (feilds.length === 0) {
    ElMessage.warning('请先选择维度或分组')
    return
  }

  // 绑定参数
  const selectFeildsState = reactive<{
    selectFeilds: string[]
  }>({
    selectFeilds: feilds.map((feild) => {
      return feild.columnName || ''
    })
  })

  /**
   * @desc
   */
  ElMessageBox({
    title: '请选择需要下载的字段',
    message: () =>
      h(
        ElCheckboxGroup,
        {
          modelValue: selectFeildsState.selectFeilds,
          'onUpdate:modelValue': (value) => {
            selectFeildsState.selectFeilds = value.map((item) => item.toString())
          },
          style: 'width: 100%;display: grid;'
        },
        () => {
          return feilds.map((feild) => {
            return h(ElCheckbox, {
              label: feild.displayName || feild.columnName,
              value: feild.columnName || ''
            })
          })
        }
      ),
    showCancelButton: false,
    confirmButtonText: '下载',
    cancelButtonText: '取消'
  })
    .then(async (action) => {
      if (action === 'confirm') {
        const data = analyseStore.getChartData
        const columns = selectFeildsState.selectFeilds
        const fileName = `${analyseStore.getAnalyseName}.xlsx`
        const sheetName = columnStore.getDataSource

        // 显示下载开始提示
        ElMessage.success(
          h('div', [
            '开始下载文件：',
            h(
              'span',
              {
                style: {
                  color: '#67c23a',
                  fontWeight: 'bold',
                  backgroundColor: '#f0f9ff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  margin: '0 4px'
                }
              },
              fileName
            )
          ])
        )

        exportToExcel(data, fileName, sheetName, columns)
      }
    })
    .catch(() => {
      ElMessage.info('取消下载')
    })
}
</script>

<style lang="scss" scoped>
.bar {
  display: flex;
  align-items: center;
}
</style>
