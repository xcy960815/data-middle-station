import { ElCheckbox, ElCheckboxGroup, ElMessage, ElMessageBox } from 'element-plus'
import { h, reactive } from 'vue'
import { useAnalyseStore } from '~/stores/analyse'
import { useColumnStore } from '~/stores/column'
import { useDimensionStore } from '~/stores/dimension'
import { useGroupStore } from '~/stores/group'
import { exportToExcel } from '~/utils/export-excel'

/**
 * 图表下载功能的 composable
 */
export const useChartDownload = () => {
  const dimensionStore = useDimensionStore()
  const groupStore = useGroupStore()
  const analyseStore = useAnalyseStore()
  const columnStore = useColumnStore()

  /**
   * 处理下载按钮点击事件
   * @returns void
   */
  const handleDownload = () => {
    // 获取所有的维度和分组
    const fields = dimensionStore.getDimensions.concat(groupStore.getGroups)
    if (fields.length === 0) {
      ElMessage.warning('请先选择维度或分组')
      return
    }

    // 绑定参数
    const selectFieldsState = reactive<{
      selectFields: string[]
    }>({
      selectFields: fields.map((field) => {
        return field.columnName || ''
      })
    })

    // 显示字段选择对话框
    ElMessageBox({
      title: '请选择需要下载的字段',
      message: () =>
        h(
          ElCheckboxGroup,
          {
            modelValue: selectFieldsState.selectFields,
            'onUpdate:modelValue': (value) => {
              selectFieldsState.selectFields = value.map((item) => item.toString())
            },
            style: 'width: 100%;display: grid;'
          },
          () => {
            return fields.map((field) => {
              return h(ElCheckbox, {
                label: field.displayName || field.columnName,
                value: field.columnName || ''
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
          await executeDownload(selectFieldsState.selectFields)
        }
      })
      .catch(() => {
        ElMessage.info('取消下载')
      })
  }

  /**
   * 执行下载操作
   * @param selectedColumns 选中的列
   */
  const executeDownload = async (selectedColumns: string[]) => {
    const data = analyseStore.getChartData
    const columns = selectedColumns
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

  return {
    handleDownload,
    executeDownload
  }
}
