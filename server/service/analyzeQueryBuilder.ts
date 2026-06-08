import type { FilterType, MeasureAggregationType, OrderType } from '@/shared/domainTypes'
import { toLine } from '@/server/utils/databaseHelper'

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

type AnalyzeAggregationType = 'raw' | 'count' | 'countDistinct' | 'sum' | 'avg' | 'max' | 'min'

export type SqlPrimitive = string | number | boolean | null

type SqlFragment = {
  sql: string
  params: SqlPrimitive[]
}

type FilterClauseFragments = {
  where: SqlFragment
  having: SqlFragment
}

type DimensionFieldExpression = {
  columnName: string
  expression: string
}

type DimensionFieldExpressions = {
  dimensions: DimensionFieldExpression[]
  expressionByColumnName: Map<string, string>
}

export type AnalyzeQueryContext = {
  tableName: string
  quotedTableName: string
  allowedColumns: Set<string>
}

export type AnalyzeSqlQuery = {
  sql: string
  params: SqlPrimitive[]
}

// ---------------------------------------------------------------------------
// SQL 映射
// ---------------------------------------------------------------------------

const FILTER_TYPE_TO_SQL_OPERATOR: Record<FilterType, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'LIKE',
  notLike: 'NOT LIKE',
  isNull: 'IS NULL',
  isNotNull: 'IS NOT NULL'
}

const ANALYZE_AGGREGATION_SQL_MAP: Record<AnalyzeAggregationType, 'RAW' | string> = {
  raw: 'RAW',
  count: 'COUNT',
  countDistinct: 'COUNT(DISTINCT %s)',
  sum: 'SUM',
  avg: 'AVG',
  max: 'MAX',
  min: 'MIN'
}

const ORDER_DIRECTION_TO_SQL: Record<OrderType, 'ASC' | 'DESC'> = {
  asc: 'ASC',
  desc: 'DESC'
}

const MAX_QUERY_LIMIT = 5000
const ANALYZE_DATETIME_SQL_FORMAT = '%Y-%m-%d %H:%i:%s'
const EMPTY_FILTER_CLAUSES: FilterClauseFragments = {
  where: { sql: '', params: [] },
  having: { sql: '', params: [] }
}

const isDateTimeColumnType = (columnType?: string) => {
  const normalizedColumnType = columnType?.toLowerCase() || ''
  return ['date', 'datetime', 'timestamp', 'time', 'year', 'datetime2', 'datetimeoffset', 'smalldatetime'].some(
    (type) => normalizedColumnType.includes(type)
  )
}

// ---------------------------------------------------------------------------
// 自定义表达式安全
// ---------------------------------------------------------------------------

const ALLOWED_EXPRESSION_FUNCTIONS = new Set([
  'abs',
  'avg',
  'ceil',
  'ceiling',
  'coalesce',
  'concat',
  'concat_ws',
  'count',
  'date',
  'date_format',
  'day',
  'floor',
  'hour',
  'if',
  'ifnull',
  'lower',
  'ltrim',
  'max',
  'min',
  'minute',
  'month',
  'nullif',
  'replace',
  'right',
  'round',
  'rtrim',
  'second',
  'substr',
  'substring',
  'sum',
  'trim',
  'upper',
  'year'
])

const DANGEROUS_EXPRESSION_PATTERN =
  /(;|--|#|\/\*|\*\/|\b(select|from|where|union|join|insert|update|delete|drop|alter|truncate|grant|revoke|create|into|outfile|load_file|benchmark|sleep|handler)\b)/i

/**
 * @desc 分析页 SQL 构建器
 */
export class AnalyzeQueryBuilder {
  // -------------------------------------------------------------------------
  // 对外 API
  // -------------------------------------------------------------------------

  public normalizeIdentifier(identifier: string, label: string): string {
    const normalizedIdentifier = toLine(String(identifier || '').trim())
    if (!normalizedIdentifier || !/^[a-z0-9_]+$/i.test(normalizedIdentifier)) {
      throw new Error(`${label}非法: ${identifier}`)
    }
    return normalizedIdentifier
  }

  public quoteIdentifier(identifier: string): string {
    return `\`${identifier}\``
  }

  public normalizeLimit(limit?: number): number {
    const numericLimit = Number(limit)
    if (!Number.isFinite(numericLimit)) {
      return 1000
    }
    return Math.min(Math.max(Math.floor(numericLimit), 1), MAX_QUERY_LIMIT)
  }

  public buildAnalyzeDataQuery(
    analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery,
    context: AnalyzeQueryContext
  ): AnalyzeSqlQuery {
    const filters = analyzeDataQuery.filters || []
    const orders = analyzeDataQuery.orders || []
    const dimensions = analyzeDataQuery.dimensions || []
    const measures = analyzeDataQuery.measures || []
    const safeLimit = this.normalizeLimit(analyzeDataQuery.commonChartConfig?.limit)
    const hasDimensions = dimensions.length > 0
    const dimensionFieldExpressions = this.buildDimensionFieldExpressions(dimensions, context)
    const selectSql = this.buildSelectClause(measures, dimensionFieldExpressions, hasDimensions, context)
    const filterClauses = this.buildFilterClauses(filters, hasDimensions, context)
    const groupBySql =
      dimensionFieldExpressions.dimensions.length > 0
        ? ` group by ${dimensionFieldExpressions.dimensions.map((dimension) => dimension.expression).join(',')}`
        : ''
    const orderBySql = this.buildOrderByClause(orders, hasDimensions, dimensionFieldExpressions, context)

    return {
      sql: `${selectSql} from ${context.quotedTableName}${filterClauses.where.sql}${groupBySql}${filterClauses.having.sql}${orderBySql} limit ${safeLimit}`,
      params: [...filterClauses.where.params, ...filterClauses.having.params]
    }
  }

  // -------------------------------------------------------------------------
  // SQL 子句：SELECT / WHERE / HAVING / ORDER BY
  // -------------------------------------------------------------------------

  private buildSelectClause(
    measures: AnalyzeDataDto.MeasureOption[],
    dimensionFieldExpressions: DimensionFieldExpressions,
    hasDimensions: boolean,
    context: AnalyzeQueryContext
  ): string {
    const selectExpressions: string[] = []

    dimensionFieldExpressions.dimensions.forEach(({ columnName, expression }) => {
      selectExpressions.push(this.formatSelectAlias(expression, columnName))
    })

    measures.forEach((measureOption) => {
      const { columnName, expression: columnExpression } = this.resolveFieldExpression(measureOption, context)

      if (!hasDimensions) {
        selectExpressions.push(
          this.formatSelectAlias(this.formatDateTimeExpression(measureOption.columnType, columnExpression), columnName)
        )
        return
      }

      const aggregationType = this.resolveMeasureAggregationType(measureOption)
      selectExpressions.push(
        this.formatSelectAlias(this.buildAggregationExpression(aggregationType, columnExpression), columnName)
      )
    })

    if (selectExpressions.length === 0) {
      throw new Error('至少需要选择一个值或维度字段')
    }

    return `select ${selectExpressions.join(',')}`
  }

  private buildFilterClauses(
    filterOptions: AnalyzeDataDto.FilterOption[],
    hasDimensions: boolean,
    context: AnalyzeQueryContext
  ): FilterClauseFragments {
    if (filterOptions.length === 0) {
      return EMPTY_FILTER_CLAUSES
    }

    const whereClauseParts: string[] = []
    const havingClauseParts: string[] = []
    const whereParams: SqlPrimitive[] = []
    const havingParams: SqlPrimitive[] = []

    filterOptions.forEach((filterOption) => {
      const { filterRule } = filterOption
      if (!filterRule.operator) return

      const operator = FILTER_TYPE_TO_SQL_OPERATOR[filterRule.operator]
      const columnExpression = this.resolveExpression(filterOption, context)
      const aggregationType = this.resolveRuleAggregationType(filterRule.aggregation)
      const isAggregateFilter = aggregationType !== 'raw'

      if (isAggregateFilter && !hasDimensions) {
        throw new Error('聚合筛选需要先配置维度字段')
      }

      const filterExpression = isAggregateFilter
        ? this.buildAggregationExpression(aggregationType, columnExpression)
        : this.formatDateTimeExpression(filterOption.columnType, columnExpression)
      const targetClauseParts = isAggregateFilter ? havingClauseParts : whereClauseParts
      const targetParams = isAggregateFilter ? havingParams : whereParams

      if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
        targetClauseParts.push(`${filterExpression} ${operator}`)
        return
      }

      if (typeof filterRule.operand === 'undefined' || filterRule.operand === '') {
        return
      }

      if (operator === 'LIKE' || operator === 'NOT LIKE') {
        targetClauseParts.push(`${filterExpression} ${operator} ?`)
        targetParams.push(`%${filterRule.operand}%`)
        return
      }

      targetClauseParts.push(`${filterExpression} ${operator} ?`)
      targetParams.push(filterRule.operand)
    })

    return {
      where: {
        sql: whereClauseParts.length ? ` where ${whereClauseParts.join(' and ')}` : '',
        params: whereParams
      },
      having: {
        sql: havingClauseParts.length ? ` having ${havingClauseParts.join(' and ')}` : '',
        params: havingParams
      }
    }
  }

  private buildOrderByClause(
    orderOptions: AnalyzeDataDto.OrderOption[],
    hasDimensions: boolean,
    dimensionFieldExpressions: DimensionFieldExpressions,
    context: AnalyzeQueryContext
  ): string {
    if (orderOptions.length === 0) {
      return ''
    }

    const orderClause = orderOptions
      .map((orderOption) => {
        const orderRule = orderOption.orderRule
        const direction = ORDER_DIRECTION_TO_SQL[orderRule.direction]
        if (!direction) {
          throw new Error(`不支持的排序方向: ${orderRule.direction}`)
        }

        const { columnName, expression: columnExpression } = this.resolveFieldExpression(orderOption, context)

        if (!hasDimensions) {
          return `${this.formatDateTimeExpression(orderOption.columnType, columnExpression)} ${direction}`
        }

        const aggregationType = this.resolveRuleAggregationType(orderRule.aggregation)

        if (aggregationType === 'raw') {
          const dimensionExpression = dimensionFieldExpressions.expressionByColumnName.get(columnName)
          if (!dimensionExpression) {
            throw new Error('聚合查询中，值字段排序需要选择总计、计数、平均等聚合方式')
          }
          return `${dimensionExpression} ${direction}`
        }

        return `${this.buildAggregationExpression(aggregationType, columnExpression)} ${direction}`
      })
      .filter(Boolean)
      .join(',')

    return orderClause ? ` order by ${orderClause}` : ''
  }

  // -------------------------------------------------------------------------
  // 维度表达式
  // -------------------------------------------------------------------------

  private buildDimensionFieldExpressions(
    dimensionOptions: AnalyzeDataDto.DimensionOption[],
    context: AnalyzeQueryContext
  ): DimensionFieldExpressions {
    const dimensions = dimensionOptions.map((dimensionOption) =>
      this.buildDimensionFieldExpression(dimensionOption, context)
    )

    return {
      dimensions,
      expressionByColumnName: new Map(dimensions.map((dimension) => [dimension.columnName, dimension.expression]))
    }
  }

  private buildDimensionFieldExpression(
    dimensionOption: AnalyzeDataDto.DimensionOption,
    context: AnalyzeQueryContext
  ): DimensionFieldExpression {
    const { columnName, expression: columnExpression } = this.resolveFieldExpression(dimensionOption, context)

    return {
      columnName,
      expression: this.formatDateTimeExpression(dimensionOption.columnType, columnExpression)
    }
  }

  // -------------------------------------------------------------------------
  // 聚合与日期格式化
  // -------------------------------------------------------------------------

  private buildAggregationExpression(aggregationType: AnalyzeAggregationType, expression: string): string {
    const aggregationTemplate = ANALYZE_AGGREGATION_SQL_MAP[aggregationType]

    if (aggregationTemplate === 'RAW') {
      return expression
    }

    if (aggregationTemplate.includes('%s')) {
      return aggregationTemplate.replace('%s', expression)
    }

    return `${aggregationTemplate}(${expression})`
  }

  private resolveMeasureAggregationType(option: {
    measureRule?: {
      aggregation?: MeasureAggregationType
    }
  }): MeasureAggregationType {
    const configuredAggregation = option.measureRule?.aggregation
    if (configuredAggregation) {
      return configuredAggregation
    }

    throw new Error('聚合查询中，值字段需要选择总计、计数、平均等聚合方式')
  }

  private resolveRuleAggregationType(aggregation?: string): AnalyzeAggregationType {
    const configuredAggregation = (aggregation || 'raw') as AnalyzeAggregationType
    if (!(configuredAggregation in ANALYZE_AGGREGATION_SQL_MAP)) {
      throw new Error(`不支持的聚合类型: ${aggregation}`)
    }

    return configuredAggregation
  }

  private formatDateTimeExpression(columnType: string | undefined, expression: string): string {
    return isDateTimeColumnType(columnType)
      ? `DATE_FORMAT(${expression}, '${ANALYZE_DATETIME_SQL_FORMAT}')`
      : expression
  }

  private formatSelectAlias(expression: string, columnName: string): string {
    return `${expression} AS ${this.quoteIdentifier(columnName)}`
  }

  // -------------------------------------------------------------------------
  // 字段解析
  // -------------------------------------------------------------------------

  private resolveFieldExpression(
    option: AnalyzeConfigDao.ColumnItem,
    context: AnalyzeQueryContext
  ): { columnName: string; expression: string } {
    const columnName = this.normalizeIdentifier(option.columnName, '字段')
    this.assertAllowedColumn(columnName, option.columnName, context)
    const expression =
      option.isCustom && option.expression
        ? this.sanitizeCustomExpression(option.expression, context)
        : this.quoteIdentifier(columnName)

    return { columnName, expression }
  }

  private resolveExpression(option: AnalyzeConfigDao.ColumnItem, context: AnalyzeQueryContext): string {
    return this.resolveFieldExpression(option, context).expression
  }

  private quoteAllowedColumn(columnName: string, context: AnalyzeQueryContext): string {
    const normalizedColumnName = this.normalizeIdentifier(columnName, '字段')
    this.assertAllowedColumn(normalizedColumnName, columnName, context)
    return this.quoteIdentifier(normalizedColumnName)
  }

  private assertAllowedColumn(normalizedColumnName: string, columnName: string, context: AnalyzeQueryContext): void {
    if (!context.allowedColumns.has(normalizedColumnName)) {
      throw new Error(`字段不存在或不允许查询: ${columnName}`)
    }
  }

  // -------------------------------------------------------------------------
  // 自定义表达式消毒
  // -------------------------------------------------------------------------

  private sanitizeCustomExpression(expression: string, context: AnalyzeQueryContext): string {
    const trimmedExpression = String(expression || '').trim()
    if (!trimmedExpression) {
      throw new Error('自定义表达式不能为空')
    }
    if (trimmedExpression.length > 500) {
      throw new Error('自定义表达式过长，请控制在 500 个字符以内')
    }

    const { sanitizedExpression, literals } = this.stripStringLiterals(trimmedExpression)
    if (DANGEROUS_EXPRESSION_PATTERN.test(sanitizedExpression)) {
      throw new Error('自定义表达式包含不允许的 SQL 关键字或注释符号')
    }
    let safeExpression = ''

    for (let index = 0; index < sanitizedExpression.length; ) {
      const currentChar = sanitizedExpression[index]

      if (/\s/.test(currentChar)) {
        safeExpression += currentChar
        index++
        continue
      }

      if (/[A-Za-z_]/.test(currentChar)) {
        let endIndex = index + 1
        while (endIndex < sanitizedExpression.length && /[A-Za-z0-9_]/.test(sanitizedExpression[endIndex])) {
          endIndex++
        }

        const token = sanitizedExpression.slice(index, endIndex)
        const nextNonSpaceIndex = sanitizedExpression.slice(endIndex).search(/\S/)
        const actualNextIndex = nextNonSpaceIndex === -1 ? -1 : endIndex + nextNonSpaceIndex
        const nextNonSpaceChar = actualNextIndex === -1 ? '' : sanitizedExpression[actualNextIndex]
        const normalizedToken = token.toLowerCase()

        if (/^__literal_\d+__$/i.test(token)) {
          safeExpression += token
          index = endIndex
          continue
        }

        if (normalizedToken === 'null' || normalizedToken === 'true' || normalizedToken === 'false') {
          safeExpression += normalizedToken.toUpperCase()
          index = endIndex
          continue
        }

        if (nextNonSpaceChar === '(') {
          if (!ALLOWED_EXPRESSION_FUNCTIONS.has(normalizedToken)) {
            throw new Error(`自定义表达式中使用了不允许的函数: ${token}`)
          }
          safeExpression += normalizedToken.toUpperCase()
        } else {
          safeExpression += this.quoteAllowedColumn(token, context)
        }

        index = endIndex
        continue
      }

      if (/\d/.test(currentChar)) {
        let endIndex = index + 1
        while (endIndex < sanitizedExpression.length && /[\d.]/.test(sanitizedExpression[endIndex])) {
          endIndex++
        }
        const numericToken = sanitizedExpression.slice(index, endIndex)
        if (!/^\d+(\.\d+)?$/.test(numericToken)) {
          throw new Error(`自定义表达式中的数字格式非法: ${numericToken}`)
        }
        safeExpression += numericToken
        index = endIndex
        continue
      }

      const twoCharOperator = sanitizedExpression.slice(index, index + 2)
      if (['>=', '<=', '!=', '<>'].includes(twoCharOperator)) {
        safeExpression += twoCharOperator
        index += 2
        continue
      }

      if ('()+-*/%,=<>&|!'.includes(currentChar)) {
        safeExpression += currentChar
        index++
        continue
      }

      throw new Error(`自定义表达式中包含不支持的字符: ${currentChar}`)
    }

    return this.restoreStringLiterals(safeExpression, literals)
  }

  private stripStringLiterals(expression: string): { sanitizedExpression: string; literals: string[] } {
    let sanitizedExpression = ''
    const literals: string[] = []

    for (let index = 0; index < expression.length; index++) {
      const currentChar = expression[index]
      if (currentChar !== "'" && currentChar !== '"') {
        sanitizedExpression += currentChar
        continue
      }

      const quote = currentChar
      let literal = quote
      index++

      while (index < expression.length) {
        const nextChar = expression[index]
        literal += nextChar
        if (nextChar === '\\') {
          index++
          if (index < expression.length) {
            literal += expression[index]
          }
          index++
          continue
        }
        if (nextChar === quote) {
          break
        }
        index++
      }

      if (!literal.endsWith(quote)) {
        throw new Error('自定义表达式中的字符串未正确闭合')
      }

      const token = `__LITERAL_${literals.length}__`
      literals.push(literal)
      sanitizedExpression += token
    }

    return { sanitizedExpression, literals }
  }

  private restoreStringLiterals(expression: string, literals: string[]): string {
    return expression.replace(/__LITERAL_(\d+)__/g, (_full, indexText: string) => literals[Number(indexText)] || '')
  }
}
