<template>
  <div class="bar relative flex">
    <el-button link @click="handleClickRefresh" class="mr-auto"> 刷新 </el-button>

    <el-button link @click="handleClickAlarm">报警</el-button>
    <el-button link @click="handleClickSetting">设置</el-button>
    <el-button link @click="handleClickFullScreen">全屏</el-button>
    <el-button link @click="handleClickDownload">下载</el-button>
    <el-button link @click="handleUpdateAnalyse">保存</el-button>
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
import * as XLSX from 'xlsx'
import { getChartDataHandler } from '../../getChartData'
import { updateAnalyseHandler } from '../../updateAnalyse'
const { queryChartData } = getChartDataHandler()
const { handleUpdateAnalyse } = updateAnalyseHandler()
const analyseStore = useAnalyseStore()
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
      // const { $webworker } = useNuxtApp()
      // const webworker = new $webworker()
      // const result = await webworker.run(() => {
      //   let sum = 0;
      //   for (let i = 1; i <= 1000000000; i++) {
      //     sum += i;
      //   }
      //   return sum;
      // })

      type DataOption = Record<string, string | number>

      function exportToExcel(
        data: DataOption[],
        fileName: string,
        sheetName: string,
        columns?: (keyof DataOption)[]
      ): void {
        let worksheet: XLSX.WorkSheet | null = null
        if (Array.isArray(columns) && columns.length > 0) {
          const filteredData = data.map((item: DataOption) => {
            const filteredItem = {} as Record<keyof DataOption, string | number>
            columns.forEach((column) => {
              filteredItem[column] = item[column]
            })
            return filteredItem
          })

          worksheet = XLSX.utils.json_to_sheet(filteredData)
        } else {
          worksheet = XLSX.utils.json_to_sheet(data)
        }

        const maxWidthMap = {} as Record<string, number>

        // 计算每列的最大宽度
        for (let k in worksheet) {
          if (!k.startsWith('!')) {
            const colIndex = k.replace(/[0-9]/g, '')
            const cellValue = worksheet[k].v.toString()
            const cellLen = Math.max(cellValue.length, 10)

            if (!maxWidthMap[colIndex]) {
              maxWidthMap[colIndex] = cellLen
            } else {
              if (cellLen > maxWidthMap[colIndex]) {
                maxWidthMap[colIndex] = cellLen
              }
            }
          }
        }

        // 设置每列的宽度
        worksheet['!cols'] = Object.keys(maxWidthMap).map((colIndex) => ({
          width: maxWidthMap[colIndex] + 2
        }))

        const workbook: XLSX.WorkBook = {
          Sheets: { [sheetName]: worksheet },
          SheetNames: [sheetName]
        }

        const excelBuffer: ArrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

        saveExcelFile(excelBuffer, fileName)
      }

      function saveExcelFile(buffer: ArrayBuffer, fileName: string): void {
        const data: Blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = window.URL.createObjectURL(data)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
      }
      exportToExcel(analyseStore.getChartData, '文件名.xlsx', '文件名', selectFeildsState.selectFeilds)
    })
    .catch((e) => {
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
