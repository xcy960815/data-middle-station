/**
 * 下划线命名格式转驼峰命名格式（如 user_name 转 userName）
 * @param {string} name 下划线字符串
 * @returns {string} 驼峰格式字符串
 */
export const toHump = (name: string) => {
  return name.replace(/_(\w)/g, function (all, letter) {
    return letter.toUpperCase()
  })
}

/**
 * 驼峰命名格式转下划线命名格式（如 userName 转 user_name）
 * @param {string} name 驼峰字符串
 * @returns {string} 下划线格式字符串
 */
export const toLine = (name: string) => {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase()
}

const specialKeys = ['orders', 'dimensions']

/**
 * 解析并提取对象的属性用于构造 SQL 插入或更新语句的值与字段集合
 * @template T
 * @param {T} rowData 实体的属性字典对象
 * @returns {{ keys: string[]; values: (string | number)[] }} 包含字段 key 列表及对应值的 values 列表
 */
export function convertToSqlProperties<T extends Record<string, any>>(
  rowData: T
): { keys: string[]; values: (string | number)[] } {
  const keys: string[] = []
  const values: (string | number)[] = []
  for (let k in rowData) {
    if (typeof rowData[k] !== 'undefined' && rowData[k] !== null) {
      const value = rowData[k]
      // 将 k 由 驼峰 转为 下划线
      const underlineKey = k.replace(/([A-Z])/g, '_$1').toLowerCase()
      // order group 字段单独处理一下
      if (specialKeys.includes(underlineKey) && typeof value === 'string') {
        keys.push('`' + underlineKey + '`')
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
    values
  }
}

const KEYWORDCOLUMNS = ['dimensions', 'orders', 'measures', 'filters', 'conditions']

/**
 * 格式化 SQL 字段名，如果是 SQL 保留/关键字则加上反引号（避免 SQL 语法解析错误）
 * @param {string} key 字段名
 * @returns {string} 格式化或转义后的字段名
 */
export function formatSqlKey(key: string) {
  if (KEYWORDCOLUMNS.includes(key)) {
    return `\`${key}\``
  }
  return key
}

/**
 * 批量格式化 SQL 字段名，并用英文逗号拼接成字符串
 * @param {string[]} keys 字段名数组
 * @returns {string} 逗号连接的格式化字段列表
 */
export function batchFormatSqlKey(keys: string[]) {
  return keys.map(formatSqlKey).join(',')
}

/**
 * 批量格式化 SQL SET 语句的参数占位符（例如：`key1 = ?, key2 = ?`）
 * @param {string[]} keys 字段名数组
 * @returns {string} 格式化后的 SQL set 片段
 */
export function batchFormatSqlSet(keys: string[]) {
  return keys
    .map(formatSqlKey)
    .map((key) => `${key} = ?`)
    .join(', ')
}
