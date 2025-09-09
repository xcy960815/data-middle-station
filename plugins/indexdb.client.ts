// 类型定义已移至 types/plugins/IndexDB.d.ts

// 常量配置
const DB_TABLES: Record<string, IndexDB.TableConfig> = {
  USERS: {
    name: 'users',
    keyPath: 'id',
    indexes: ['id', 'name', 'email', 'age', 'city', 'createTime']
  },
  SALES_RATING: {
    name: 'salesRatingTable',
    keyPath: 'id',
    indexes: ['id', 'createTime', 'shortName', 'autoLine', 'number', 'slaughterDate']
  },
  SALES_RATING_HOOK: {
    name: 'salesRatinghookTable',
    keyPath: 'id',
    indexes: ['id', 'createTime', 'shortName', 'autoLine', 'number', 'slaughterDate', 'rfid']
  },
  GRADING: {
    name: 'gradingTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'createTime', 'shortName', 'slaughterDate']
  },
  GRADING_WEIGHT: {
    name: 'gradingWeightTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'createTime', 'shortName', 'slaughterDate', 'tagCode', 'sort']
  },
  RFID: {
    name: 'rfidTable',
    keyPath: 'rfid',
    indexes: ['rfid', 'createTime']
  },
  BT_PRODUCE: {
    name: 'btProduceTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'createTime', 'tradeDate']
  },
  BT_WEIGHT: {
    name: 'btWeightTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'tradeDate', 'syncType']
  },
  WEIGHING_HANDOVER: {
    name: 'weighingHandoverTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'produceDate', 'syncType']
  },
  BT_REQUISITION: {
    name: 'btRequisitionTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'rfid', 'createTime', 'tradeDate']
  },
  PRODUCT_WEIGHING: {
    name: 'productWeighingTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'produceDate', 'syncType']
  },
  SCAN: {
    name: 'scanTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'tagCode', 'syncType']
  },
  RFID_SCAN: {
    name: 'rifdScanTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'tagCode', 'syncType']
  },
  BT_REQ_WEIGHT: {
    name: 'btReqWeightTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'syncType']
  },
  SCAN_HANDOVER: {
    name: 'scanHandoverTable',
    keyPath: 'id',
    indexes: ['id', 'tradeNo', 'syncType']
  }
}

// 错误消息常量
const ERROR_MESSAGES = {
  BROWSER_NOT_SUPPORT: '浏览器不支持IndexedDB',
  DB_OPEN_ERROR: 'IndexedDB数据库打开错误',
  DB_DELETE_ERROR: '删除数据库出错',
  TRANSACTION_ERROR: '事务失败',
  DATA_WRITE_SUCCESS: '数据写入成功',
  DATA_WRITE_ERROR: '数据写入失败',
  CLEAR_DATA_SUCCESS: '清空数据成功',
  CLEAR_DATA_ERROR: '清空数据失败',
  DB_CLOSED: '数据库已关闭',
  DELETE_ERROR: '删除数据时发生错误',
  TRAVERSE_ERROR: '遍历数据时发生错误',
  QUERY_ERROR: '查询数据时发生错误'
}

class IndexDBManager {
  // indexedDB兼容
  private indexedDB =
    (window as IndexDB.WindowWithIndexedDB).indexedDB ||
    (window as IndexDB.WindowWithIndexedDB).webkitIndexedDB ||
    (window as IndexDB.WindowWithIndexedDB).msIndexedDB ||
    (window as IndexDB.WindowWithIndexedDB).mozIndexedDB

  /**
   * 打开数据库
   * 新对象储存空间newStore参数：newStore.name、newStore.key
   * 新增对象存储空间要更改数据库版本
   * @param {string} databaseName - 数据库名称
   * @param {number} version - 数据库版本号
   * @returns {Promise<IDBDatabase | null>} 返回数据库实例或null（失败时）
   */
  openDatabase(databaseName: string, version: number): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      let db: IDBDatabase
      const finalVersion = version || 1
      if (!this.indexedDB) {
        console.error(ERROR_MESSAGES.BROWSER_NOT_SUPPORT)
        resolve(null)
        return
      }
      const request = this.indexedDB.open(databaseName, finalVersion)

      request.onerror = function () {
        console.error(ERROR_MESSAGES.DB_OPEN_ERROR)
        resolve(null)
      }

      request.onsuccess = function (event: Event) {
        db = (event.target as IDBOpenDBRequest).result
        console.log(`数据库 ${databaseName} 打开成功`)
        resolve(db)
      }

      // onupgradeneeded，调用创建新的储存空间
      request.onupgradeneeded = function (event: IDBVersionChangeEvent) {
        db = (event.target as IDBOpenDBRequest).result

        // 使用配置化方式创建所有表
        Object.values(DB_TABLES).forEach((tableConfig) => {
          if (!db.objectStoreNames.contains(tableConfig.name)) {
            const objectStore = db.createObjectStore(tableConfig.name, { keyPath: tableConfig.keyPath })

            // 为每个字段创建索引
            tableConfig.indexes.forEach((index) => {
              objectStore.createIndex(index, index, { unique: false })
            })
          }
        })
      }
    })
  }

  /**
   * 删除数据库
   * @param {string} databaseName - 要删除的数据库名称
   * @returns {Promise<boolean>} 返回删除操作是否成功
   */
  deleteDatabase(databaseName: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.indexedDB) {
        console.error(ERROR_MESSAGES.BROWSER_NOT_SUPPORT)
        resolve(false)
        return
      }
      const deleteRequest = this.indexedDB.deleteDatabase(databaseName)
      deleteRequest.onerror = function () {
        console.error(ERROR_MESSAGES.DB_DELETE_ERROR)
        resolve(false)
      }
      deleteRequest.onsuccess = function () {
        console.log(`数据库 ${databaseName} 删除成功`)
        resolve(true)
      }
    })
  }

  /**
   * 关闭数据库
   * @param {IDBDatabase} database - 要关闭的数据库实例
   * @returns {void} 无返回值
   */
  closeDatabase(database: IDBDatabase) {
    database.close()
    console.log(ERROR_MESSAGES.DB_CLOSED)
  }

  /**
   * 删除数据
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {string} indexName - 索引字段名称
   * @param {string | number} searchValue - 要删除的数据的查询值
   * @returns {Promise<boolean>} 返回删除操作是否成功
   */
  deleteData(
    database: IDBDatabase,
    storeName: string,
    indexName: string,
    searchValue: string | number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const store = database.transaction(storeName, 'readwrite').objectStore(storeName)
      const index = store.index(indexName)
      const request = index.openCursor(IDBKeyRange.only(searchValue))

      request.onsuccess = function (event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          cursor.delete()
          cursor.continue() // 继续查找其他匹配的项
        } else {
          console.log(`数据删除成功: ${indexName}=${searchValue}`)
          resolve(true)
        }
      }

      request.onerror = function () {
        console.error(ERROR_MESSAGES.DELETE_ERROR)
        resolve(false)
      }
    })
  }

  /**
   * 清空数据
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @returns {Promise<boolean>} 返回清空操作是否成功
   */
  clearData(database: IDBDatabase, storeName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const store = database.transaction(storeName, 'readwrite').objectStore(storeName)
      const request = store.clear()

      request.onsuccess = function () {
        console.log(`数据表 ${storeName} 清空成功`)
        resolve(true)
      }

      request.onerror = function () {
        console.error(ERROR_MESSAGES.CLEAR_DATA_ERROR)
        resolve(false)
      }
    })
  }

  /**
   * 添加数据 (同步版本)
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {IndexDB.DataRecord[]} dataList - 要添加的数据记录数组
   * @returns {void} 无返回值，操作结果通过控制台输出
   */
  addData(database: IDBDatabase, storeName: string, dataList: IndexDB.DataRecord[]) {
    const store = database.transaction([storeName], 'readwrite').objectStore(storeName)
    dataList.forEach((item) => {
      const request = store.add(item)
      request.onsuccess = function () {
        console.log(ERROR_MESSAGES.DATA_WRITE_SUCCESS)
      }
      request.onerror = function () {
        console.error(ERROR_MESSAGES.DATA_WRITE_ERROR)
      }
    })
  }

  /**
   * 添加数据 (Promise版本)
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {IndexDB.DataRecord[]} dataList - 要添加的数据记录数组
   * @returns {Promise<void>} 返回Promise，添加完成时resolve
   */
  addDataAsync(database: IDBDatabase, storeName: string, dataList: IndexDB.DataRecord[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      let completedCount = 0
      const totalCount = dataList.length

      if (totalCount === 0) {
        resolve()
        return
      }

      dataList.forEach((item) => {
        const request = store.add(item)
        request.onsuccess = function () {
          completedCount++
          if (completedCount === totalCount) {
            console.log(ERROR_MESSAGES.DATA_WRITE_SUCCESS)
            resolve()
          }
        }
        request.onerror = function () {
          console.error(ERROR_MESSAGES.DATA_WRITE_ERROR)
          reject(new Error(ERROR_MESSAGES.DATA_WRITE_ERROR))
        }
      })
    })
  }

  /**
   * @deprecated 使用 addDataAsync 替代
   */
  newAddData(database: IDBDatabase, storeName: string, dataList: IndexDB.DataRecord[]): Promise<void> {
    return this.addDataAsync(database, storeName, dataList)
  }

  /**
   * 更新数据
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {IndexDB.DataRecord[]} dataList - 要更新的数据记录数组
   * @returns {Promise<boolean>} 返回更新操作是否成功
   */
  updateData(database: IDBDatabase, storeName: string, dataList: IndexDB.DataRecord[]): Promise<boolean> {
    return new Promise((resolve) => {
      const transaction = database.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      let completedCount = 0
      const totalCount = dataList.length

      if (totalCount === 0) {
        resolve(true)
        return
      }

      dataList.forEach((item) => {
        const request = store.put(item)
        request.onsuccess = function () {
          completedCount++
          if (completedCount === totalCount) {
            console.log(`数据更新成功，共更新 ${totalCount} 条记录`)
            resolve(true)
          }
        }
        request.onerror = function () {
          console.error('数据更新失败')
          resolve(false)
        }
      })
    })
  }

  /**
   * 根据主键获取数据(数据库的下标)
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {IDBValidKey} primaryKey - 主键值
   * @returns {Promise<IndexDB.DataRecord | undefined>} 返回查询到的数据记录或undefined
   */
  getData(database: IDBDatabase, storeName: string, primaryKey: IDBValidKey): Promise<IndexDB.DataRecord | undefined> {
    const objectStore = database.transaction(storeName).objectStore(storeName)
    const request = objectStore.get(primaryKey)

    request.onerror = function () {
      console.error(ERROR_MESSAGES.TRANSACTION_ERROR)
    }

    return new Promise((resolve) => {
      request.onsuccess = function (e: Event) {
        resolve((e.target as IDBRequest<IndexDB.DataRecord | undefined>).result)
      }
    })
  }

  /**
   * 分页获取数据
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {string} indexName - 索引字段名称
   * @param {IDBValidKey} searchValue - 查询的值
   * @param {number} page - 页码(可选，默认1)
   * @param {number} pageSize - 每页条数(可选，默认10)
   * @returns {Promise<IndexDB.QueryResult>} 返回分页查询结果，包含总数和数据数组
   */
  getDataByPage(
    database: IDBDatabase,
    storeName: string,
    indexName: string,
    searchValue: IDBValidKey,
    page?: number,
    pageSize?: number
  ): Promise<IndexDB.QueryResult> {
    const data: IndexDB.QueryResult = {
      total: 0,
      rows: []
    }

    const objectStore = database.transaction(storeName, 'readonly').objectStore(storeName)
    const indexes = objectStore.index(indexName)
    const range = IDBKeyRange.only(searchValue)

    // 创建一个count请求获取条数
    const countRequest = indexes.count(range)
    countRequest.onsuccess = function (event: Event) {
      data.total = (event.target as IDBRequest<number>).result
    }

    const request = indexes.openCursor(range, 'prev')
    let isFirst = true

    return new Promise((resolve) => {
      request.onsuccess = function (e: Event) {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result
        if (page !== undefined && pageSize !== undefined) {
          if (isFirst && page > 0 && cursor) {
            // 只需要移动一次就行了 如果是第一页 不需要移动
            cursor.advance(page * pageSize) // 移动到第几条
            isFirst = false
            return
          }
          if (cursor === null) return resolve(data) // 数据到底
          data.rows.push(cursor.value as IndexDB.DataRecord)
          if (pageSize > data.rows.length) {
            // 数据还没到10条
            cursor.continue()
          } else {
            resolve(data) // 拿到10条了
          }
        } else {
          if (cursor) {
            data.rows.push(cursor.value as IndexDB.DataRecord)
            cursor.continue() // 继续查找其他记录
          } else {
            resolve(data)
          }
        }
      }
    })
  }

  /**
   * UTC日期转换
   * @param {string | number | Date} dateValue - 要转换的日期值
   * @returns {string} 返回ISO格式的UTC日期字符串
   */
  utcDate(val: string | number | Date): string {
    return new Date(val).toISOString()
  }

  /**
   * 根据单一条件进行查询
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {string} indexName - 索引字段名称
   * @param {IDBValidKey} searchValue - 查询的值
   * @returns {Promise<IndexDB.DataRecord[]>} 返回匹配条件的数据记录数组
   */
  getDataByone(
    database: IDBDatabase,
    storeName: string,
    indexName: string,
    searchValue: IDBValidKey
  ): Promise<IndexDB.DataRecord[]> {
    const objectStore = database.transaction(storeName, 'readonly').objectStore(storeName)
    const indexes = objectStore.index(indexName)
    const range = IDBKeyRange.only(searchValue)
    const request = indexes.openCursor(range, 'prev')
    const data: IndexDB.DataRecord[] = []

    return new Promise((resolve) => {
      request.onsuccess = function (e: Event) {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          data.push(cursor.value as IndexDB.DataRecord)
          cursor.continue() // 继续查找其他记录
        } else {
          resolve(data)
        }
      }
    })
  }

  /**
   * 获取所有数据
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @returns {Promise<IndexDB.DataRecord[]>} 返回存储表中的所有数据记录
   */
  getAllData(database: IDBDatabase, storeName: string): Promise<IndexDB.DataRecord[]> {
    const objectStore = database.transaction(storeName, 'readonly').objectStore(storeName)
    const request = objectStore.getAll()

    return new Promise((resolve) => {
      request.onsuccess = function (e: Event) {
        resolve((e.target as IDBRequest<IndexDB.DataRecord[]>).result)
      }
    })
  }

  /**
   * 根据参数进行筛选并按照指定字段倒序排列
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {string} indexName - 索引字段名称
   * @param {IDBValidKey} searchValue - 查询的值
   * @param {string} sortField - 排序字段名称(默认为createTime)
   * @returns {Promise<IndexDB.DataRecord[]>} 返回按指定字段排序的数据记录数组
   */
  getDataByoneWithSort(
    database: IDBDatabase,
    storeName: string,
    indexName: string,
    searchValue: IDBValidKey,
    sortField: string = 'createTime'
  ): Promise<IndexDB.DataRecord[]> {
    const objectStore = database.transaction(storeName, 'readonly').objectStore(storeName)
    const indexes = objectStore.index(indexName)
    const range = IDBKeyRange.only(searchValue)
    const request = indexes.openCursor(range)
    const data: IndexDB.DataRecord[] = []

    return new Promise((resolve, reject) => {
      request.onsuccess = function (e: Event) {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          data.push(cursor.value as IndexDB.DataRecord)
          cursor.continue()
        } else {
          // Sort data by sortField in descending order
          data.sort((a, b) => {
            const aValue = a[sortField] as string
            const bValue = b[sortField] as string
            return new Date(bValue).getTime() - new Date(aValue).getTime()
          })
          resolve(data)
        }
      }

      request.onerror = function (e: Event) {
        reject((e.target as IDBRequest).error)
      }
    })
  }

  /**
   * 检查并添加数据
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {string} fieldName - 要检查的字段名
   * @param {IDBValidKey} fieldValue - 要检查的字段值
   * @param {IndexDB.DataRecord} dataRecord - 要添加的数据记录
   * @returns {Promise<string>} 返回"已存在"或"添加成功"
   */
  checkAndAdd(
    database: IDBDatabase,
    storeName: string,
    fieldName: string,
    fieldValue: IDBValidKey,
    dataRecord: IndexDB.DataRecord
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getDataByone(database, storeName, fieldName, fieldValue)
        .then((res) => {
          if (res && res.length > 0) {
            resolve('已存在')
          } else {
            this.addData(database, storeName, [dataRecord])
            resolve('添加成功')
          }
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  /**
   * 获取createTime最早的一条数据
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @returns {Promise<IndexDB.DataRecord | null>} 返回最早的一条数据或null
   */
  getEarliestByCreateTime(database: IDBDatabase, storeName: string): Promise<IndexDB.DataRecord | null> {
    return new Promise((resolve, reject) => {
      this.getAllData(database, storeName)
        .then((allData) => {
          if (allData.length === 0) {
            resolve(null)
            return
          }
          // 按createTime升序排序
          const sorted = allData.sort((a, b) => {
            const aValue = a.createTime as string
            const bValue = b.createTime as string
            return new Date(aValue).getTime() - new Date(bValue).getTime()
          })
          resolve(sorted[0])
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  /**
   * 根据字段和值删除数据
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {string} fieldName - 要匹配的字段名
   * @param {unknown} fieldValue - 要匹配的字段值
   * @returns {Promise<number>} 返回删除的记录数
   */
  deleteDataByCondition(
    database: IDBDatabase,
    storeName: string,
    fieldName: string,
    fieldValue: unknown
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.openCursor()
      const keysToDelete: IDBValidKey[] = []

      request.onsuccess = function (event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          const cursorValue = cursor.value as IndexDB.DataRecord
          if (cursorValue[fieldName] === fieldValue) {
            keysToDelete.push(cursor.primaryKey)
          }
          cursor.continue()
        } else {
          // 遍历完成，开始删除
          if (keysToDelete.length === 0) {
            resolve(0)
            return
          }

          let deletedCount = 0
          const deleteNext = () => {
            if (deletedCount < keysToDelete.length) {
              const deleteRequest = store.delete(keysToDelete[deletedCount])
              deleteRequest.onsuccess = () => {
                deletedCount++
                deleteNext()
              }
              deleteRequest.onerror = () => {
                reject(new Error(ERROR_MESSAGES.DELETE_ERROR))
              }
            } else {
              resolve(deletedCount)
            }
          }

          deleteNext()
        }
      }

      request.onerror = function () {
        reject(new Error(ERROR_MESSAGES.TRAVERSE_ERROR))
      }
    })
  }

  /**
   * 根据多个条件查询数据
   * @param {IDBDatabase} database - 数据库实例
   * @param {string} storeName - 存储表名称
   * @param {IndexDB.DataRecord} queryConditions - 查询条件对象 {field1: value1, field2: value2}
   * @returns {Promise<IndexDB.DataRecord[]>} 返回匹配的数据记录数组
   */
  getDataByConditions(
    database: IDBDatabase,
    storeName: string,
    queryConditions: IndexDB.DataRecord
  ): Promise<IndexDB.DataRecord[]> {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.openCursor()
      const results: IndexDB.DataRecord[] = []

      request.onsuccess = function (event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          const data = cursor.value as IndexDB.DataRecord
          let match = true

          // 检查所有条件
          for (const key in queryConditions) {
            if (data[key] !== queryConditions[key]) {
              match = false
              break
            }
          }

          if (match) {
            results.push(data)
          }
          cursor.continue()
        } else {
          // 遍历完成
          resolve(results)
        }
      }

      request.onerror = function () {
        reject(new Error(ERROR_MESSAGES.QUERY_ERROR))
      }
    })
  }
}

// 创建单例实例
const indexDBManager = new IndexDBManager()

export default defineNuxtPlugin(() => {
  return {
    provide: {
      indexdb: indexDBManager
    }
  }
})
