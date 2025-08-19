import * as XLSX from 'xlsx'

/**
 * 导出Excel
 * @param {ChartDataDao.ChartData} data 数据
 * @param {string} fileName 文件名
 * @param {string} sheetName 表名
 * @param {string[]} columns 列名
 */
export const exportToExcel = async (
  data: ChartDataDao.ChartData,
  fileName: string,
  sheetName: string,
  columns?: string[]
) => {
  let worksheet: XLSX.WorkSheet | null = null

  // 使用 setTimeout 来避免阻塞主线程
  const processData = (): Promise<{
    processedData: Record<string, string | number | boolean | null | undefined>[]
    maxWidthMap: Record<string, number>
  }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let processedData: Record<string, string | number | boolean | null | undefined>[]
        let maxWidthMap: Record<string, number> = {}

        if (Array.isArray(columns) && columns.length > 0) {
          // 数据过滤
          processedData = data.map((item) => {
            const filteredItem = {} as Record<string, string | number | boolean | null | undefined>
            columns.forEach((column) => {
              const value = item[column]
              if (
                typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean' ||
                value === null ||
                value === undefined
              ) {
                filteredItem[column] = value
              } else {
                filteredItem[column] = String(value)
              }
            })
            return filteredItem
          })

          // 计算列宽
          const headers = columns

          // 计算表头宽度
          headers.forEach((header, index) => {
            const colIndex = String.fromCharCode(65 + index) // A, B, C...
            maxWidthMap[colIndex] = Math.max(header.length, 10)
          })

          // 计算数据宽度
          processedData.forEach((row) => {
            headers.forEach((header, index) => {
              const colIndex = String.fromCharCode(65 + index)
              const cellValue = String(row[header] || '')
              const cellLen = Math.max(cellValue.length, 10)

              if (!maxWidthMap[colIndex] || cellLen > maxWidthMap[colIndex]) {
                maxWidthMap[colIndex] = cellLen
              }
            })
          })
        } else {
          // 使用原始数据
          processedData = data.map((item) => {
            const processedItem = {} as Record<string, string | number | boolean | null | undefined>
            Object.keys(item).forEach((key) => {
              const value = item[key]
              if (
                typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean' ||
                value === null ||
                value === undefined
              ) {
                processedItem[key] = value
              } else {
                processedItem[key] = String(value)
              }
            })
            return processedItem
          })

          // 计算列宽（基于所有数据的键）
          const allKeys = new Set<string>()
          processedData.forEach((item) => {
            Object.keys(item).forEach((key) => allKeys.add(key))
          })

          const keysArray = Array.from(allKeys)
          keysArray.forEach((key, index) => {
            const colIndex = String.fromCharCode(65 + index)
            maxWidthMap[colIndex] = Math.max(key.length, 10)
          })

          // 计算数据宽度
          processedData.forEach((row) => {
            keysArray.forEach((key, index) => {
              const colIndex = String.fromCharCode(65 + index)
              const cellValue = String(row[key] || '')
              const cellLen = Math.max(cellValue.length, 10)

              if (!maxWidthMap[colIndex] || cellLen > maxWidthMap[colIndex]) {
                maxWidthMap[colIndex] = cellLen
              }
            })
          })
        }

        resolve({
          processedData,
          maxWidthMap
        })
      }, 0)
    })
  }

  try {
    const { processedData, maxWidthMap } = await processData()
    worksheet = XLSX.utils.json_to_sheet(processedData)

    // 设置每列的宽度
    worksheet['!cols'] = Object.keys(maxWidthMap).map((colIndex) => ({
      width: maxWidthMap[colIndex] + 2
    }))
  } catch (error) {
    console.error('数据处理失败:', error)
    // 降级处理：在主线程中处理
    if (Array.isArray(columns) && columns.length > 0) {
      const filteredData = data.map((item) => {
        const filteredItem = {} as Record<string, string | number | boolean | null | undefined>
        columns.forEach((column) => {
          const value = item[column]
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null ||
            value === undefined
          ) {
            filteredItem[column] = value
          } else {
            filteredItem[column] = String(value)
          }
        })
        return filteredItem
      })
      worksheet = XLSX.utils.json_to_sheet(filteredData)
    } else {
      const processedData = data.map((item) => {
        const processedItem = {} as Record<string, string | number | boolean | null | undefined>
        Object.keys(item).forEach((key) => {
          const value = item[key]
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null ||
            value === undefined
          ) {
            processedItem[key] = value
          } else {
            processedItem[key] = String(value)
          }
        })
        return processedItem
      })
      worksheet = XLSX.utils.json_to_sheet(processedData)
    }

    // 在主线程中计算列宽
    const maxWidthMap = {} as Record<string, number>
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

    worksheet['!cols'] = Object.keys(maxWidthMap).map((colIndex) => ({
      width: maxWidthMap[colIndex] + 2
    }))
  }

  const workbook: XLSX.WorkBook = {
    Sheets: { [sheetName]: worksheet },
    SheetNames: [sheetName]
  }

  const excelBuffer: ArrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

  saveExcelFile(excelBuffer, fileName)
}

/**
 * 保存Excel文件
 * @param {ArrayBuffer} buffer 文件缓冲区
 * @param {string} fileName 文件名
 */
export const saveExcelFile = (buffer: ArrayBuffer, fileName: string): void => {
  const data: Blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
}
