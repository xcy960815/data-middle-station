import { ElCheckbox, ElCheckboxGroup, ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

/**
 * Excel 单元格值类型
 */
type ExcelCellValue = string | number | boolean | null | undefined

/**
 * 处理后的数据行类型
 */
type ProcessedDataRow = Record<string, ExcelCellValue>

/**
 * 列宽映射类型
 */
type ColumnWidthMap = Record<string, number>

/**
 * 图表下载功能的 composable
 */
export const useChartDownload = () => {
  const dimensionStore = useDimensionsStore()
  const groupStore = useGroupsStore()
  const analyzeStore = useAnalyzeStore()
  const columnStore = useColumnsStore()

  /**
   * 转换值为 Excel 兼容格式
   * @param value 原始值
   * @returns Excel 兼容的值
   */
  const normalizeCellValue = (value: unknown): ExcelCellValue => {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null ||
      value === undefined
    ) {
      return value
    }
    return String(value)
  }

  /**
   * 处理数据行，转换为 Excel 兼容格式
   * @param item 原始数据项
   * @param columns 要包含的列（可选）
   * @returns 处理后的数据行
   */
  const processDataRow = (item: AnalyzeDataVo.ChartData, columns?: string[]): ProcessedDataRow => {
    const processedRow: ProcessedDataRow = {}

    if (Array.isArray(columns) && columns.length > 0) {
      columns.forEach((column) => {
        processedRow[column] = normalizeCellValue(item[column])
      })
    } else {
      Object.keys(item).forEach((key) => {
        processedRow[key] = normalizeCellValue(item[key])
      })
    }

    return processedRow
  }

  /**
   * 将数字索引转换为 Excel 列索引（A, B, C...）
   * @param index 数字索引
   * @returns Excel 列索引
   */
  const getColumnIndex = (index: number): string => {
    return String.fromCharCode(65 + index)
  }

  /**
   * 计算列宽映射
   * @param processedData 处理后的数据
   * @param headers 表头数组
   * @returns 列宽映射
   */
  const calculateColumnWidths = (processedData: ProcessedDataRow[], headers: string[]): ColumnWidthMap => {
    const maxWidthMap: ColumnWidthMap = {}

    // 计算表头宽度
    headers.forEach((header, index) => {
      const colIndex = getColumnIndex(index)
      maxWidthMap[colIndex] = Math.max(header.length, 10)
    })

    // 计算数据宽度
    processedData.forEach((row) => {
      headers.forEach((header, index) => {
        const colIndex = getColumnIndex(index)
        const cellValue = String(row[header] || '')
        const cellLength = Math.max(cellValue.length, 10)

        if (!maxWidthMap[colIndex] || cellLength > maxWidthMap[colIndex]) {
          maxWidthMap[colIndex] = cellLength
        }
      })
    })

    return maxWidthMap
  }

  /**
   * 从工作表计算列宽
   * @param worksheet Excel 工作表
   * @returns 列宽映射
   */
  const calculateColumnWidthsFromWorksheet = (worksheet: XLSX.WorkSheet): ColumnWidthMap => {
    const maxWidthMap: ColumnWidthMap = {}

    for (const cellKey in worksheet) {
      if (!cellKey.startsWith('!')) {
        const colIndex = cellKey.replace(/[0-9]/g, '')
        const cellValue = worksheet[cellKey].v?.toString() || ''
        const cellLength = Math.max(cellValue.length, 10)

        if (!maxWidthMap[colIndex] || cellLength > maxWidthMap[colIndex]) {
          maxWidthMap[colIndex] = cellLength
        }
      }
    }

    return maxWidthMap
  }

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
      selectFields: fields.map((field) => field.columnName || '')
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
   * 显示下载开始提示
   * @param fileName 文件名
   */
  const showDownloadStartMessage = (fileName: string): void => {
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
  }

  /**
   * 执行下载操作
   * @param selectedColumns 选中的列
   */
  const executeDownload = async (selectedColumns: string[]): Promise<void> => {
    const data = analyzeStore.getAnalyzeData
    const fileName = `${analyzeStore.getAnalyzeName}.xlsx`
    const sheetName = columnStore.getDataSource

    showDownloadStartMessage(fileName)
    await exportToExcel(data, fileName, sheetName, selectedColumns)
  }

  /**
   * 处理数据并计算列宽（异步处理，避免阻塞主线程）
   * @param data 原始数据
   * @param columns 要包含的列（可选）
   * @returns 处理后的数据和列宽映射
   */
  const processDataAsync = (
    data: Array<AnalyzeDataVo.ChartData>,
    columns?: string[]
  ): Promise<{
    processedData: ProcessedDataRow[]
    maxWidthMap: ColumnWidthMap
  }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const processedData = data.map((item) => processDataRow(item, columns))

        let headers: string[]
        if (Array.isArray(columns) && columns.length > 0) {
          headers = columns
        } else {
          // 获取所有唯一的键
          const allKeys = new Set<string>()
          processedData.forEach((item) => {
            Object.keys(item).forEach((key) => allKeys.add(key))
          })
          headers = Array.from(allKeys)
        }

        const maxWidthMap = calculateColumnWidths(processedData, headers)

        resolve({
          processedData,
          maxWidthMap
        })
      }, 0)
    })
  }

  /**
   * 处理数据（同步处理，用于降级方案）
   * @param data 原始数据
   * @param columns 要包含的列（可选）
   * @returns 处理后的数据
   */
  const processDataSync = (data: Array<AnalyzeDataVo.ChartData>, columns?: string[]): ProcessedDataRow[] => {
    return data.map((item) => processDataRow(item, columns))
  }

  /**
   * 设置工作表列宽
   * @param worksheet Excel 工作表
   * @param maxWidthMap 列宽映射
   */
  const setWorksheetColumnWidths = (worksheet: XLSX.WorkSheet, maxWidthMap: ColumnWidthMap): void => {
    worksheet['!cols'] = Object.keys(maxWidthMap).map((colIndex) => ({
      width: maxWidthMap[colIndex] + 2
    }))
  }

  /**
   * 创建 Excel 工作簿
   * @param worksheet Excel 工作表
   * @param sheetName 工作表名称
   * @returns Excel 工作簿
   */
  const createWorkbook = (worksheet: XLSX.WorkSheet, sheetName: string): XLSX.WorkBook => {
    return {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName]
    }
  }

  /**
   * 导出Excel
   * @param data 数据
   * @param fileName 文件名
   * @param sheetName 表名
   * @param columns 列名（可选）
   */
  const exportToExcel = async (
    data: Array<AnalyzeDataVo.ChartData>,
    fileName: string,
    sheetName: string,
    columns?: string[]
  ): Promise<void> => {
    let worksheet: XLSX.WorkSheet

    try {
      // 异步处理数据，避免阻塞主线程
      const { processedData, maxWidthMap } = await processDataAsync(data, columns)
      worksheet = XLSX.utils.json_to_sheet(processedData)
      setWorksheetColumnWidths(worksheet, maxWidthMap)
    } catch (error) {
      console.error('数据处理失败:', error)
      // 降级处理：在主线程中同步处理
      const processedData = processDataSync(data, columns)
      worksheet = XLSX.utils.json_to_sheet(processedData)
      const maxWidthMap = calculateColumnWidthsFromWorksheet(worksheet)
      setWorksheetColumnWidths(worksheet, maxWidthMap)
    }

    const workbook = createWorkbook(worksheet, sheetName)
    const excelBuffer: ArrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    saveExcelFile(excelBuffer, fileName)
  }

  /**
   * 保存Excel文件
   * @param buffer 文件缓冲区
   * @param fileName 文件名
   */
  const saveExcelFile = (buffer: ArrayBuffer, fileName: string): void => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    // 清理 URL 对象，释放内存
    window.URL.revokeObjectURL(url)
  }

  return {
    handleDownload,
    executeDownload,
    exportToExcel,
    saveExcelFile
  }
}
