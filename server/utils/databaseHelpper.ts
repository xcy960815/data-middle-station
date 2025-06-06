/**
 * @desc 将对象中的key转换为下划线格式 用于数据库新建、更新的时候使用
 * @param inputRecord { Record<string, any> }
 * @returns { keys: string[], values: any[] }
 */
export function transformObjectIntoSet(inputRecord: Record<string, any>) {
  const entries = Object.entries(inputRecord)
    .filter(([, value]) => typeof value !== 'undefined')
    .map(([key, value]) => {
      const transformedKey = key.replace(/([A-Z])/g, (_, c) => `_${c.toLowerCase()}`)
      return {
        key: `${transformedKey} = ?`,
        value,
      }
    })

  return {
    keys: entries.map(entry => entry.key),
    values: entries.map(entry => entry.value),
  }
}

/**
 * @desc 下划线转驼峰
 * @param name {string} 下划线字符串
 * @returns {string}
 */
export const toHump = (name: string) => {
  return name.replace(/\_(\w)/g, function (all, letter) {
    return letter.toUpperCase()
  })
}

/**
 * @desc 驼峰转下划线
 * @param name {string} 驼峰字符串
 * @returns {string}
 */
export const toLine = (name: string) => {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase()
}

const specialKeys = ['order', 'group']

/**
 * @desc 获取对象的属性
 * @param rowData {Object}
 * @returns {{keys: string[], values: (string | number)[]}}}
 */
export function convertToSqlProperties<T extends Record<string, any>>(
  rowData: T
): { keys: string[]; values: (string | number)[] } {
  const keys: string[] = []
  const values: (string | number)[] = []
  for (let k in rowData) {
    if (typeof rowData[k] !== 'undefined') {
      const value = rowData[k]
      // 将 k 由 驼峰 转为 下划线
      const underlineKey = k.replace(/([A-Z])/g, '_$1').toLowerCase()
      // order group 字段单独处理一下
      if (specialKeys.includes(underlineKey) && typeof value === 'string') {
        keys.push('\`' + underlineKey + '\`')
      } else {
        keys.push(underlineKey)
      }
      if (typeof value === 'object' && value !== null) {
        values.push(JSON.stringify(value))
      } else {
        values.push(value)
      }
    }
  }
  return {
    keys,
    values,
  }
}

const KEYWORDCOLUMNS = ['group', 'order', 'column', 'limit']

// 工具函数：格式化 SQL 字段名
export function formatSqlKey(key: string) {
  if (KEYWORDCOLUMNS.includes(key)) {
    return `\`${key}\``
  }
  return key
}
/**
 * @desc 批量格式化 SQL 字段名
 * @param keys {string[]} 字段名数组
 * @returns {string} 格式化后的字段名
 */
export function batchFormatSqlKey(keys: string[]) {
  return keys.map(formatSqlKey).join(',')
}
/**
 * @desc 批量格式化 SQL set 语句
 * @param keys {string[]} 字段名数组
 * @returns {string} 形如 key1 = ?, key2 = ?
 */
export function batchFormatSqlSet(keys: string[]) {
  return keys
    .map(formatSqlKey)
    .map(key => `${key} = ?`)
    .join(', ')
}
