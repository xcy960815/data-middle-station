import fs from 'fs'

const sql = fs.readFileSync('sql/data_middle_station.sql', 'utf8')
const inserts = [...sql.matchAll(/INSERT INTO `analyze_config`[^;]+;/gs)]

const LEGACY_KEYS = [
  'orderType',
  'filterType',
  'filterValue',
  'aggregationType',
  'datasetFieldName',
  'datasetFieldType',
  'datasetAggregationType'
]

const VALID_MEASURE_AGG = new Set(['count', 'countDistinct', 'sum', 'avg', 'max', 'min'])
const VALID_FILTER_AGG = new Set(['raw', 'count', 'countDistinct', 'sum', 'avg', 'max', 'min'])
const VALID_ORDER_AGG = VALID_FILTER_AGG
const VALID_FILTER_OP = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'notLike', 'isNull', 'isNotNull'])
const VALID_DIRECTION = new Set(['asc', 'desc'])

function parseInsertRow(statement) {
  const valuesMatch = statement.match(/VALUES \((.*)\);$/s)
  if (!valuesMatch) return null

  const fields = [
    'id',
    'analyze_id',
    'version_no',
    'data_source',
    'measures',
    'filters',
    'dimensions',
    'orders',
    'chart_type',
    'common_chart_config',
    'private_chart_config',
    'change_note',
    'create_time',
    'created_by',
    'update_time',
    'is_deleted'
  ]

  const raw = valuesMatch[1]
  const parts = []
  let current = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (escaped) {
      current += ch
      escaped = false
      continue
    }
    if (ch === '\\') {
      current += ch
      escaped = true
      continue
    }
    if (ch === "'") {
      inString = !inString
      current += ch
      continue
    }
    if (ch === ',' && !inString) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())

  if (parts.length < fields.length) return null

  const row = {}
  fields.forEach((field, index) => {
    let value = parts[index]
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value
        .slice(1, -1)
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    }
    row[field] = value
  })

  return row
}

function parseJsonArray(text, label) {
  if (!text || text === '[]') return []
  try {
    return JSON.parse(text)
  } catch (error) {
    return { __parseError: `${label}: ${error.message}` }
  }
}

const issues = []
const summary = {
  total: inserts.length,
  emptyConfig: 0,
  withMeasures: 0,
  withFilters: 0,
  withDimensions: 0,
  withOrders: 0,
  legacyKeyHits: 0,
  missingRuleObjects: 0,
  invalidEnumValues: 0,
  uiNoiseFields: 0
}

const UI_NOISE = new Set([
  'align',
  'fixed',
  'width',
  'sortable',
  'filterable',
  'showOverflowTooltip',
  'alias'
])

for (const insert of inserts) {
  const statement = insert[0]
  const row = parseInsertRow(statement)
  if (!row) {
    issues.push({ severity: 'error', id: '?', message: 'INSERT 行解析失败' })
    continue
  }

  const id = row.id

  for (const key of LEGACY_KEYS) {
    if (statement.includes(`\\"${key}\\"`)) {
      summary.legacyKeyHits++
      issues.push({ severity: 'error', id, message: `仍含旧字段 ${key}` })
    }
  }

  const measures = parseJsonArray(row.measures, 'measures')
  const filters = parseJsonArray(row.filters, 'filters')
  const dimensions = parseJsonArray(row.dimensions, 'dimensions')
  const orders = parseJsonArray(row.orders, 'orders')

  for (const data of [
    ['measures', measures],
    ['filters', filters],
    ['dimensions', dimensions],
    ['orders', orders]
  ].map(([, data]) => data)) {
    if (data?.__parseError) {
      issues.push({ severity: 'error', id, message: `JSON 解析失败: ${data.__parseError}` })
      continue
    }
  }

  if (Array.isArray(measures) && measures.length === 0 && Array.isArray(dimensions) && dimensions.length === 0) {
    summary.emptyConfig++
  }
  if (Array.isArray(measures) && measures.length > 0) summary.withMeasures++
  if (Array.isArray(filters) && filters.length > 0) summary.withFilters++
  if (Array.isArray(dimensions) && dimensions.length > 0) summary.withDimensions++
  if (Array.isArray(orders) && orders.length > 0) summary.withOrders++

  if (Array.isArray(measures)) {
    measures.forEach((item, index) => {
      if (!item.measureRule?.aggregation) {
        summary.missingRuleObjects++
        issues.push({ severity: 'error', id, message: `measures[${index}] 缺少 measureRule.aggregation` })
      } else if (!VALID_MEASURE_AGG.has(item.measureRule.aggregation)) {
        summary.invalidEnumValues++
        issues.push({
          severity: 'error',
          id,
          message: `measures[${index}] 非法聚合值 ${item.measureRule.aggregation}`
        })
      }
      Object.keys(item).forEach((key) => {
        if (UI_NOISE.has(key)) summary.uiNoiseFields++
      })
    })
  }

  if (Array.isArray(filters)) {
    filters.forEach((item, index) => {
      if (!item.filterRule) {
        summary.missingRuleObjects++
        issues.push({ severity: 'error', id, message: `filters[${index}] 缺少 filterRule` })
        return
      }
      if (item.filterRule.operator && !VALID_FILTER_OP.has(item.filterRule.operator)) {
        summary.invalidEnumValues++
        issues.push({
          severity: 'error',
          id,
          message: `filters[${index}] 非法 operator ${item.filterRule.operator}`
        })
      }
      if (item.filterRule.aggregation && !VALID_FILTER_AGG.has(item.filterRule.aggregation)) {
        summary.invalidEnumValues++
        issues.push({
          severity: 'error',
          id,
          message: `filters[${index}] 非法 aggregation ${item.filterRule.aggregation}`
        })
      }
    })
  }

  if (Array.isArray(dimensions)) {
    dimensions.forEach((item, index) => {
      if (!item.dimensionRule) {
        summary.missingRuleObjects++
        issues.push({ severity: 'warn', id, message: `dimensions[${index}] 缺少 dimensionRule` })
      }
    })
  }

  if (Array.isArray(orders)) {
    orders.forEach((item, index) => {
      if (!item.orderRule?.direction) {
        summary.missingRuleObjects++
        issues.push({ severity: 'error', id, message: `orders[${index}] 缺少 orderRule.direction` })
        return
      }
      if (!VALID_DIRECTION.has(item.orderRule.direction)) {
        summary.invalidEnumValues++
        issues.push({
          severity: 'error',
          id,
          message: `orders[${index}] 非法 direction ${item.orderRule.direction}`
        })
      }
      if (item.orderRule.aggregation && !VALID_ORDER_AGG.has(item.orderRule.aggregation)) {
        summary.invalidEnumValues++
        issues.push({
          severity: 'error',
          id,
          message: `orders[${index}] 非法 aggregation ${item.orderRule.aggregation}`
        })
      }
    })
  }
}

const notes = []

for (const insert of inserts) {
  const row = parseInsertRow(insert[0])
  if (!row) continue
  const measures = parseJsonArray(row.measures, 'measures')
  const filters = parseJsonArray(row.filters, 'filters')
  const dimensions = parseJsonArray(row.dimensions, 'dimensions')

  if (Array.isArray(measures) && measures.length === 0 && Array.isArray(dimensions) && dimensions.length === 0) {
    notes.push({ id: row.id, note: '空配置（measures/dimensions 都为空）', changeNote: row.change_note })
  }

  if (insert[0].includes('"columns"')) {
    issues.push({ severity: 'warn', id: row.id, message: '仍保存了 columns 运行态字段' })
  }
  if (insert[0].includes('__invalid')) {
    issues.push({ severity: 'warn', id: row.id, message: '仍含运行时校验字段 __invalid' })
  }

  if (Array.isArray(filters) && filters.length > 0) {
    notes.push({
      id: row.id,
      note: '含 filters',
      filters: filters.map((item) => ({
        columnName: item.columnName,
        operator: item.filterRule?.operator,
        operand: item.filterRule?.operand,
        aggregation: item.filterRule?.aggregation
      }))
    })
  }
}

console.log('=== analyze_config 清洗检查 ===')
console.log(JSON.stringify(summary, null, 2))
console.log(`\n结构/枚举问题: ${issues.length}`)
issues.forEach((issue) => {
  console.log(`[${issue.severity}] id=${issue.id} ${issue.message}`)
})
console.log('\n备注:')
notes.forEach((note) => console.log(JSON.stringify(note)))
console.log(`\nUI 冗余字段计数（align/fixed/width 等）: ${summary.uiNoiseFields} 处，不影响查询，属于历史持久化噪音`)
