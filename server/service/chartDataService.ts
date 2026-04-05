import { ChartDataMapper } from '@/server/mapper/chartDataMapper'
import { DatabaseService } from '@/server/service/databaseService'
import { toLine } from '@/server/utils/databaseHelper'

type SqlPrimitive = string | number | boolean | null

type SqlFragment = {
  sql: string
  params: SqlPrimitive[]
}

type QueryContext = {
  tableName: string
  quotedTableName: string
  allowedColumns: Set<string>
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
 * @desc 图表数据服务
 */
export class ChartDataService {
  /**
   * @desc 图表数据mapper
   */
  private chartDataMapper: ChartDataMapper

  /**
   * @desc 数据库服务
   */
  private databaseService: DatabaseService

  /**
   * @desc 构造函数
   */
  constructor() {
    this.chartDataMapper = new ChartDataMapper()
    this.databaseService = new DatabaseService()
  }

  /**
   * @desc 将DAO对象转换为VO对象
   * @param analyzeDataRecords {AnalyzeDataDao.AnalyzeData[]} 图表数据DAO列表
   * @returns {AnalyzeDataVo.AnalyzeData[]} 图表数据VO列表
   */
  private convertDaoToVo(analyzeDataRecords: Array<AnalyzeDataDao.AnalyzeData>): Array<AnalyzeDataVo.AnalyzeData> {
    return analyzeDataRecords.map((analyzeDataRecord) => ({
      ...analyzeDataRecord,
      [String(analyzeDataRecord.columnName)]: analyzeDataRecord.columnValue
    }))
  }

  /**
   * @desc 构建select语句
   * @param dimensions {AnalyzeDataDto.DimensionOption[]} 维度
   * @param groups {AnalyzeDataDto.GroupOption[]} 分组
   * @returns {string} select语句
   */
  private async createQueryContext(dataSource: string): Promise<QueryContext> {
    const normalizedTableName = this.normalizeIdentifier(dataSource, '数据源')
    const columns = await this.databaseService.getTableColumns({
      tableName: normalizedTableName
    })

    if (columns.length === 0) {
      throw new Error(`数据源不存在或无可用字段: ${normalizedTableName}`)
    }

    return {
      tableName: normalizedTableName,
      quotedTableName: this.quoteIdentifier(normalizedTableName),
      allowedColumns: new Set(columns.map((column) => this.normalizeIdentifier(column.columnName, '字段')))
    }
  }

  /**
   * @desc 规范化标识符
   * @param identifier 原始标识符
   * @param label 错误提示标签
   * @returns 规范化后的标识符
   */
  private normalizeIdentifier(identifier: string, label: string): string {
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
  private quoteIdentifier(identifier: string): string {
    return `\`${identifier}\``
  }

  /**
   * @desc 解析普通列名
   * @param columnName 字段名
   * @param context 查询上下文
   * @returns SQL 字段表达式
   */
  private resolveColumnName(columnName: string, context: QueryContext): string {
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
  private sanitizeCustomExpression(expression: string, context: QueryContext): string {
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
  private resolveExpression(
    option: { columnName: string; isCustom?: boolean; expression?: string },
    context: QueryContext
  ): string {
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
   * @desc 构建select语句
   * @param dimensions {AnalyzeDataDto.DimensionOption[]} 维度
   * @param groups {AnalyzeDataDto.GroupOption[]} 分组
   * @param context 查询上下文
   * @returns {string} select语句
   */
  private buildSelectClause(
    dimensions: AnalyzeDataDto.DimensionOption[],
    groups: AnalyzeDataDto.GroupOption[],
    context: QueryContext
  ): SqlFragment {
    let selectClause = 'select'

    // 合并 dimensions 和 groups 中的列
    const allColumns = [
      ...dimensions,
      ...groups.filter((group) => !dimensions.some((dim) => dim.columnName === group.columnName))
    ]

    allColumns.forEach((columnOption: AnalyzeDataDto.DimensionOption | AnalyzeDataDto.GroupOption) => {
      const columnName = this.normalizeIdentifier(columnOption.columnName, '字段')
      const columnExpression = this.resolveExpression(columnOption, context)

      // 检查是否是日期时间类型的列
      const isDateTimeColumn = /date|time|created_at|updated_at/i.test(columnName)
      const fieldExpression = isDateTimeColumn
        ? `DATE_FORMAT(${columnExpression}, '%Y-%m-%d %H:%i:%s')`
        : columnExpression
      selectClause += ` ${fieldExpression} AS ${this.quoteIdentifier(columnName)},`
    })
    return {
      sql: selectClause.slice(0, selectClause.length - 1),
      params: []
    }
  }

  /**
   * @desc 构建where语句
   * @param filterOptions {AnalyzeDataDto.FilterOption[]} 过滤条件
   * @returns {string} where语句
   */
  private buildWhereClause(filterOptions: AnalyzeDataDto.FilterOption[], context: QueryContext): SqlFragment {
    if (filterOptions.length === 0) {
      return {
        sql: '',
        params: []
      }
    }

    const whereClauseParts: string[] = []
    const params: SqlPrimitive[] = []

    filterOptions.forEach((filterOption) => {
      if (!filterOption.filterType) return

      const normalizedFilterType = String(filterOption.filterType).trim().toLowerCase()
      const operator = FILTER_OPERATOR_MAP[normalizedFilterType]
      if (!operator) {
        throw new Error(`不支持的筛选操作: ${filterOption.filterType}`)
      }

      const columnExpression = this.resolveExpression(filterOption, context)
      if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
        whereClauseParts.push(`${columnExpression} ${operator}`)
        return
      }

      if (typeof filterOption.filterValue === 'undefined' || filterOption.filterValue === '') {
        return
      }

      if (operator === 'LIKE' || operator === 'NOT LIKE') {
        whereClauseParts.push(`${columnExpression} ${operator} ?`)
        params.push(`%${filterOption.filterValue}%`)
        return
      }

      whereClauseParts.push(`${columnExpression} ${operator} ?`)
      params.push(filterOption.filterValue)
    })

    return {
      sql: whereClauseParts.length ? ` where ${whereClauseParts.join(' and ')}` : '',
      params
    }
  }

  /**
   * @desc 构建orderBy语句
   * @param orderOptions {AnalyzeDataDto.OrderOption[]} 排序条件
   * @param hasGroupBy {boolean} 是否有分组
   * @returns {string} orderBy语句
   */
  private buildOrderByClause(
    orderOptions: AnalyzeDataDto.OrderOption[],
    hasGroupBy: boolean,
    context: QueryContext
  ): SqlFragment {
    if (orderOptions.length === 0) {
      return {
        sql: '',
        params: []
      }
    }

    const orderClause = orderOptions
      .map((orderOption) => {
        const direction = ORDER_TYPE_MAP[String(orderOption.orderType || '').toLowerCase()]
        if (!direction) {
          throw new Error(`不支持的排序方向: ${orderOption.orderType}`)
        }

        const columnExpression = this.resolveExpression(orderOption, context)
        const aggregationType = String(orderOption.aggregationType || 'raw').toLowerCase()

        // 如果没有分组，或者聚合类型是 raw，则不使用聚合函数
        if (!hasGroupBy || aggregationType === 'raw') {
          return `${columnExpression} ${direction}`
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
   * @param groupOptions {AnalyzeDataDto.GroupOption[]} 分组条件
   * @param dimensions {AnalyzeDataDto.DimensionOption[]} 维度
   * @returns {string} groupBy语句
   */
  private buildGroupByClause(
    groupOptions: AnalyzeDataDto.GroupOption[],
    dimensions: AnalyzeDataDto.DimensionOption[],
    context: QueryContext
  ): SqlFragment {
    if (groupOptions.length === 0) {
      return {
        sql: '',
        params: []
      }
    }
    // 合并 groups 和 dimensions 中的列名
    const allGroupColumns = [
      ...groupOptions.map((groupOption) => this.resolveExpression(groupOption, context)),
      ...dimensions.map((dimensionOption) => this.resolveExpression(dimensionOption, context))
    ]
    return {
      sql: ` group by ${allGroupColumns.join(',')}`,
      params: []
    }
  }

  /**
   * @desc 规范化 limit
   * @param limit 原始 limit
   * @returns 安全 limit
   */
  private normalizeLimit(limit?: number): number {
    const numericLimit = Number(limit)
    if (!Number.isFinite(numericLimit)) {
      return 1000
    }
    return Math.min(Math.max(Math.floor(numericLimit), 1), MAX_QUERY_LIMIT)
  }

  /**
   * @desc 获取图表数据
   * @param analyzeDataQuery {AnalyzeDataDto.AnalyzeDataQuery} 请求参数
   * @returns {Promise<AnalyzeDataVo.AnalyzeData[]>} 图表数据VO列表
   */
  public async getAnalyzeData(
    analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery
  ): Promise<Array<AnalyzeDataVo.AnalyzeData>> {
    // 归一化请求参数，确保数组字段不为空
    const normalizedQuery: AnalyzeDataDto.AnalyzeDataQuery = {
      ...analyzeDataQuery,
      filters: analyzeDataQuery.filters || [],
      orders: analyzeDataQuery.orders || [],
      groups: analyzeDataQuery.groups || [],
      dimensions: analyzeDataQuery.dimensions || []
    }
    const queryContext = await this.createQueryContext(normalizedQuery.dataSource)
    const safeLimit = this.normalizeLimit(normalizedQuery.commonChartConfig?.limit)

    /**
     * @desc 构建select语句
     */
    const selectClause = this.buildSelectClause(normalizedQuery.dimensions, normalizedQuery.groups, queryContext)
    /**
     * @desc 构建where语句
     */
    const whereClause = this.buildWhereClause(normalizedQuery.filters, queryContext)
    /**
     * @desc 构建orderBy语句
     */
    const hasGroupBy = normalizedQuery.groups.length > 0
    const orderByClause = this.buildOrderByClause(normalizedQuery.orders, hasGroupBy, queryContext)
    /**
     * @desc 构建groupBy语句
     */
    const groupByClause = this.buildGroupByClause(normalizedQuery.groups, normalizedQuery.dimensions, queryContext)

    /**
     * @desc 构建sql语句
     */
    const sql = `${selectClause.sql} from ${queryContext.quotedTableName}${whereClause.sql}${groupByClause.sql}${orderByClause.sql} limit ${safeLimit}`
    const params = [...selectClause.params, ...whereClause.params, ...groupByClause.params, ...orderByClause.params]

    /**
     * @desc 获取图表数据
     */
    try {
      const analyzeDataRecords = await this.chartDataMapper.getAnalyzeData(sql, params)
      return this.convertDaoToVo(analyzeDataRecords)
    } catch (error: any) {
      error.sql = sql
      throw error
    }
  }
}
