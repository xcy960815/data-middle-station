import { toLine } from '@/server/utils/databaseHelper'

export type SqlPrimitive = string | number | boolean | null

type SqlFragment = {
  sql: string
  params: SqlPrimitive[]
}

type FilterClauseFragments = {
  where: SqlFragment
  having: SqlFragment
}

type QueryFieldOption = {
  columnName: string
  isCustom?: boolean
  expression?: string
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

const MAX_QUERY_LIMIT = 5000

const ORDER_TYPE_MAP: Record<string, 'ASC' | 'DESC'> = {
  asc: 'ASC',
  desc: 'DESC'
}

const FILTER_OPERATOR_MAP: Record<string, string> = {
  eq: '=',
  '=': '=',
  neq: '!=',
  '!=': '!=',
  gt: '>',
  '>': '>',
  gte: '>=',
  '>=': '>=',
  lt: '<',
  '<': '<',
  lte: '<=',
  '<=': '<=',
  like: 'LIKE',
  notlike: 'NOT LIKE',
  'is null': 'IS NULL',
  isnull: 'IS NULL',
  'is not null': 'IS NOT NULL',
  isnotnull: 'IS NOT NULL'
}

const AGGREGATION_MAP: Record<string, string> = {
  count: 'COUNT',
  countdistinct: 'COUNT(DISTINCT %s)',
  sum: 'SUM',
  avg: 'AVG',
  max: 'MAX',
  min: 'MIN',
  raw: 'RAW'
}

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
 * @desc 分析页 SQL 构建器。保持纯函数式依赖，便于快照测试。
 */
export class AnalyzeQueryBuilder {
  /**
   * @desc 规范化标识符
   * @param identifier 原始标识符
   * @param label 错误提示标签
   * @returns 规范化后的标识符
   */
  public normalizeIdentifier(identifier: string, label: string): string {
    const normalizedIdentifier = toLine(String(identifier || '').trim())
    if (!normalizedIdentifier || !/^[a-z0-9_]+$/i.test(normalizedIdentifier)) {
      throw new Error(`${label}非法: ${identifier}`)
    }
    return normalizedIdentifier
  }

  /**
   * @desc 给标识符加安全引号
   * @param identifier 标识符
   * @returns 安全的 SQL 标识符
   */
  public quoteIdentifier(identifier: string): string {
    return `\`${identifier}\``
  }

  /**
   * @desc 规范化 limit
   * @param limit 原始 limit
   * @returns 安全 limit
   */
  public normalizeLimit(limit?: number): number {
    const numericLimit = Number(limit)
    if (!Number.isFinite(numericLimit)) {
      return 1000
    }
    return Math.min(Math.max(Math.floor(numericLimit), 1), MAX_QUERY_LIMIT)
  }

  /**
   * @desc 构建完整分析 SQL
   * @param analyzeDataQuery 查询参数
   * @param context 查询上下文
   * @returns SQL 和参数
   */
  public buildAnalyzeDataQuery(
    analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery,
    context: AnalyzeQueryContext
  ): AnalyzeSqlQuery {
    const normalizedQuery: AnalyzeDataDto.AnalyzeDataQuery = {
      ...analyzeDataQuery,
      filters: analyzeDataQuery.filters || [],
      orders: analyzeDataQuery.orders || [],
      dimensions: analyzeDataQuery.dimensions || [],
      measures: analyzeDataQuery.measures || []
    }
    const safeLimit = this.normalizeLimit(normalizedQuery.commonChartConfig?.limit)
    const hasGroupBy = normalizedQuery.dimensions.length > 0
    const selectClause = this.buildSelectClause(normalizedQuery.measures, normalizedQuery.dimensions, context)
    const filterClauses = this.buildFilterClauses(
      normalizedQuery.filters,
      hasGroupBy,
      normalizedQuery.dimensions,
      context
    )
    const groupByClause = this.buildGroupByClause(normalizedQuery.dimensions, context)
    const orderByClause = this.buildOrderByClause(
      normalizedQuery.orders,
      hasGroupBy,
      normalizedQuery.dimensions,
      context
    )

    return {
      sql: `${selectClause.sql} from ${context.quotedTableName}${filterClauses.where.sql}${groupByClause.sql}${filterClauses.having.sql}${orderByClause.sql} limit ${safeLimit}`,
      params: [
        ...selectClause.params,
        ...filterClauses.where.params,
        ...groupByClause.params,
        ...filterClauses.having.params,
        ...orderByClause.params
      ]
    }
  }

  /**
   * @desc 解析普通列名
   * @param columnName 字段名
   * @param context 查询上下文
   * @returns SQL 字段表达式
   */
  private resolveColumnName(columnName: string, context: AnalyzeQueryContext): string {
    const normalizedColumnName = this.normalizeIdentifier(columnName, '字段')
    if (!context.allowedColumns.has(normalizedColumnName)) {
      throw new Error(`字段不存在或不允许查询: ${columnName}`)
    }
    return this.quoteIdentifier(normalizedColumnName)
  }

  /**
   * @desc 解析表达式中的字符串字面量
   * @param expression 原始表达式
   * @returns 字符串字面量占位后的表达式和原字面量
   */
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

  /**
   * @desc 还原表达式中的字符串字面量
   * @param expression 已转换表达式
   * @param literals 原始字符串字面量
   * @returns 最终表达式
   */
  private restoreStringLiterals(expression: string, literals: string[]): string {
    return expression.replace(/__LITERAL_(\d+)__/g, (_full, indexText: string) => literals[Number(indexText)] || '')
  }

  /**
   * @desc 校验并转换自定义表达式
   * @param expression 原始表达式
   * @param context 查询上下文
   * @returns 安全表达式
   */
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
          safeExpression += this.resolveColumnName(token, context)
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

  /**
   * @desc 解析字段或自定义表达式
   * @param option 字段配置
   * @param context 查询上下文
   * @returns SQL 表达式
   */
  private resolveExpression(option: QueryFieldOption, context: AnalyzeQueryContext): string {
    if (option.isCustom && option.expression) {
      return this.sanitizeCustomExpression(option.expression, context)
    }

    return this.resolveColumnName(option.columnName, context)
  }

  /**
   * @desc 构建聚合表达式
   * @param aggregationType 聚合类型
   * @param expression 字段表达式
   * @returns 聚合后的 SQL 表达式
   */
  private buildAggregationExpression(aggregationType: string, expression: string): string {
    const normalizedAggregation = String(aggregationType || '').toLowerCase()
    const aggregationTemplate = AGGREGATION_MAP[normalizedAggregation]

    if (!aggregationTemplate) {
      throw new Error(`不支持的聚合类型: ${aggregationType}`)
    }

    if (aggregationTemplate === 'RAW') {
      return expression
    }

    if (aggregationTemplate.includes('%s')) {
      return aggregationTemplate.replace('%s', expression)
    }

    return `${aggregationTemplate}(${expression})`
  }

  /**
   * @desc 获取值字段聚合方式
   * @param option 字段配置
   * @returns 聚合方式
   */
  private resolveMeasureAggregationType(option: {
    measureRule?: {
      aggregation?: string
    }
  }): string {
    const configuredAggregation = option.measureRule?.aggregation
    if (configuredAggregation && String(configuredAggregation).toLowerCase() !== 'raw') {
      return configuredAggregation
    }

    throw new Error('聚合查询中，值字段需要选择总计、计数、平均等聚合方式')
  }

  /**
   * @desc 判断字段是否应按日期时间格式分组展示
   * @param columnName 字段名
   * @returns 是否日期时间字段
   */
  private isDateTimeColumnName(columnName: string): boolean {
    return /date|time|created_at|updated_at/i.test(columnName)
  }

  /**
   * @desc 构建分组字段表达式，确保 SELECT/GROUP BY/ORDER BY 使用同一表达式
   * @param columnOption 查询字段配置
   * @param context 查询上下文
   * @returns 分组字段名与表达式
   */
  private buildGroupFieldExpression(
    columnOption: QueryFieldOption,
    context: AnalyzeQueryContext
  ): { columnName: string; expression: string } {
    const columnName = this.normalizeIdentifier(columnOption.columnName, '字段')
    const columnExpression = this.resolveExpression(columnOption, context)
    const expression = this.isDateTimeColumnName(columnName)
      ? `DATE_FORMAT(${columnExpression}, '%Y-%m-%d %H:%i:%s')`
      : columnExpression

    return {
      columnName,
      expression
    }
  }

  /**
   * @desc 构建select语句
   * @param measures 值/度量字段
   * @param dimensions 分组
   * @param context 查询上下文
   * @returns select语句
   */
  private buildSelectClause(
    measures: AnalyzeDataDto.MeasureOption[],
    dimensions: AnalyzeDataDto.DimensionOption[],
    context: AnalyzeQueryContext
  ): SqlFragment {
    const selectExpressions: string[] = []
    const hasGroupBy = dimensions.length > 0

    dimensions.forEach((columnOption: AnalyzeDataDto.DimensionOption) => {
      const { columnName, expression } = this.buildGroupFieldExpression(columnOption, context)
      selectExpressions.push(`${expression} AS ${this.quoteIdentifier(columnName)}`)
    })

    measures.forEach((columnOption: AnalyzeDataDto.MeasureOption) => {
      const columnName = this.normalizeIdentifier(columnOption.columnName, '字段')
      const columnExpression = this.resolveExpression(columnOption, context)

      if (!hasGroupBy) {
        const fieldExpression = this.isDateTimeColumnName(columnName)
          ? `DATE_FORMAT(${columnExpression}, '%Y-%m-%d %H:%i:%s')`
          : columnExpression
        selectExpressions.push(`${fieldExpression} AS ${this.quoteIdentifier(columnName)}`)
        return
      }

      const aggregationType = this.resolveMeasureAggregationType(columnOption)
      selectExpressions.push(
        `${this.buildAggregationExpression(aggregationType, columnExpression)} AS ${this.quoteIdentifier(columnName)}`
      )
    })

    if (selectExpressions.length === 0) {
      throw new Error('至少需要选择一个值或分组字段')
    }

    return {
      sql: `select ${selectExpressions.join(',')}`,
      params: []
    }
  }

  /**
   * @desc 构建where/having语句
   * @param filterOptions 过滤条件
   * @param hasGroupBy 是否有分组
   * @param dimensionOptions 分组条件
   * @param context 查询上下文
   * @returns where/having 片段
   */
  private buildFilterClauses(
    filterOptions: AnalyzeDataDto.FilterOption[],
    hasGroupBy: boolean,
    dimensionOptions: AnalyzeDataDto.DimensionOption[],
    context: AnalyzeQueryContext
  ): FilterClauseFragments {
    if (filterOptions.length === 0) {
      return {
        where: {
          sql: '',
          params: []
        },
        having: {
          sql: '',
          params: []
        }
      }
    }

    const whereClauseParts: string[] = []
    const havingClauseParts: string[] = []
    const whereParams: SqlPrimitive[] = []
    const havingParams: SqlPrimitive[] = []
    filterOptions.forEach((filterOption) => {
      const { filterRule } = filterOption
      if (!filterRule.operator) return

      const normalizedFilterType = String(filterRule.operator).trim().toLowerCase()
      const operator = FILTER_OPERATOR_MAP[normalizedFilterType]
      if (!operator) {
        throw new Error(`不支持的筛选操作: ${filterRule.operator}`)
      }

      const columnName = this.normalizeIdentifier(filterOption.columnName, '字段')
      const columnExpression = this.resolveExpression(filterOption, context)
      const aggregationType = String(filterRule.aggregation || 'raw').toLowerCase()
      const isAggregateFilter = aggregationType !== 'raw'
      if (isAggregateFilter && !hasGroupBy) {
        throw new Error('聚合筛选需要先配置分组字段')
      }

      const filterExpression = isAggregateFilter
        ? this.buildAggregationExpression(aggregationType, columnExpression)
        : this.isDateTimeColumnName(columnName)
          ? `DATE_FORMAT(${columnExpression}, '%Y-%m-%d %H:%i:%s')`
          : columnExpression
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

  /**
   * @desc 构建orderBy语句
   * @param orderOptions 排序条件
   * @param hasGroupBy 是否有分组
   * @param dimensionOptions 分组条件
   * @param context 查询上下文
   * @returns order by 片段
   */
  private buildOrderByClause(
    orderOptions: AnalyzeDataDto.OrderOption[],
    hasGroupBy: boolean,
    dimensionOptions: AnalyzeDataDto.DimensionOption[],
    context: AnalyzeQueryContext
  ): SqlFragment {
    if (orderOptions.length === 0) {
      return {
        sql: '',
        params: []
      }
    }

    const dimensionColumnSet = new Set(
      dimensionOptions.map((dimensionOption) => this.normalizeIdentifier(dimensionOption.columnName, '字段'))
    )
    const orderClause = orderOptions
      .map((orderOption) => {
        const orderRule = orderOption.orderRule
        const direction = ORDER_TYPE_MAP[String(orderRule.direction || '').toLowerCase()]
        if (!direction) {
          throw new Error(`不支持的排序方向: ${orderRule.direction}`)
        }

        const columnName = this.normalizeIdentifier(orderOption.columnName, '字段')
        const columnExpression = this.resolveExpression(orderOption, context)
        const configuredAggregationType = String(orderRule.aggregation || '').toLowerCase()

        if (!hasGroupBy) {
          return `${columnExpression} ${direction}`
        }

        const aggregationType = configuredAggregationType || 'raw'

        if (aggregationType === 'raw') {
          if (!dimensionColumnSet.has(columnName)) {
            throw new Error('聚合查询中，值字段排序需要选择总计、计数、平均等聚合方式')
          }
          return `${this.buildGroupFieldExpression(orderOption, context).expression} ${direction}`
        }

        return `${this.buildAggregationExpression(aggregationType, columnExpression)} ${direction}`
      })
      .filter(Boolean)
      .join(',')

    return {
      sql: orderClause ? ` order by ${orderClause}` : '',
      params: []
    }
  }

  /**
   * @desc 构建groupBy语句
   * @param dimensionOptions 分组条件
   * @param context 查询上下文
   * @returns group by 片段
   */
  private buildGroupByClause(
    dimensionOptions: AnalyzeDataDto.DimensionOption[],
    context: AnalyzeQueryContext
  ): SqlFragment {
    if (dimensionOptions.length === 0) {
      return {
        sql: '',
        params: []
      }
    }
    const allGroupColumns = dimensionOptions.map(
      (dimensionOption) => this.buildGroupFieldExpression(dimensionOption, context).expression
    )
    return {
      sql: ` group by ${allGroupColumns.join(',')}`,
      params: []
    }
  }
}
