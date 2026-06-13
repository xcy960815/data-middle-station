import type {
  AnalyzeFilterOperator,
  AnalyzeMeasureAggregationType,
  AnalyzeOrderDirection
} from '@/shared/analyzeConfigTypes'
import { toLine } from '@/server/utils/databaseHelper'

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/**
 * 分析页聚合类型
 * @typedef {'raw' | 'count' | 'countDistinct' | 'sum' | 'avg' | 'max' | 'min'} AnalyzeAggregationType
 */
type AnalyzeAggregationType = 'raw' | 'count' | 'countDistinct' | 'sum' | 'avg' | 'max' | 'min'

/**
 * SQL 基础参数值类型
 * @typedef {string | number | boolean | null} SqlPrimitive
 */
export type SqlPrimitive = string | number | boolean | null

/**
 * SQL 片段及其关联的参数
 * @typedef {object} SqlFragment
 * @property {string} sql SQL 语句片段
 * @property {SqlPrimitive[]} params 参数值数组
 */
type SqlFragment = {
  sql: string
  params: SqlPrimitive[]
}

/**
 * 筛选条件子句片段（分为 WHERE 和 HAVING）
 * @typedef {object} FilterClauseFragments
 * @property {SqlFragment} where WHERE 子句片段
 * @property {SqlFragment} having HAVING 子句片段
 */
type FilterClauseFragments = {
  where: SqlFragment
  having: SqlFragment
}

/**
 * 维度字段的列名及 SQL 表达式
 * @typedef {object} DimensionFieldExpression
 * @property {string} columnName 字段列名
 * @property {string} expression 维度字段的 SQL 表达式
 */
type DimensionFieldExpression = {
  columnName: string
  expression: string
}

/**
 * 维度字段的 SQL 表达式集合
 * @typedef {object} DimensionFieldExpressions
 * @property {DimensionFieldExpression[]} dimensions 维度字段列表
 * @property {Map<string, string>} expressionByColumnName 字段列名到 SQL 表达式的映射 Map
 */
type DimensionFieldExpressions = {
  dimensions: DimensionFieldExpression[]
  expressionByColumnName: Map<string, string>
}

/**
 * 分析查询上下文
 * @typedef {object} AnalyzeQueryContext
 * @property {string} tableName 表名（一般为 "dataset:ID" 格式）
 * @property {string} quotedTableName 经过处理/带引号的表名或子查询 SQL
 * @property {Set<string>} allowedColumns 允许查询的合法列名集合（用于防 SQL 注入校验）
 */
export type AnalyzeQueryContext = {
  tableName: string
  quotedTableName: string
  allowedColumns: Set<string>
}

/**
 * 构建完成的分析查询 SQL 及参数
 * @typedef {object} AnalyzeSqlQuery
 * @property {string} sql 完整的 SELECT 语句 SQL
 * @property {SqlPrimitive[]} params SQL 占位符对应参数数组
 */
export type AnalyzeSqlQuery = {
  sql: string
  params: SqlPrimitive[]
}

// ---------------------------------------------------------------------------
// SQL 映射
// ---------------------------------------------------------------------------

/**
 * 筛选类型操作符到 SQL 条件操作符的映射表
 * @type {Record<AnalyzeFilterOperator, string>}
 */
const FILTER_TYPE_TO_SQL_OPERATOR: Record<AnalyzeFilterOperator, string> = {
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

/**
 * 分析聚合类型到 SQL 聚合函数模板的映射表
 * @type {Record<AnalyzeAggregationType, 'RAW' | string>}
 */
const ANALYZE_AGGREGATION_SQL_MAP: Record<AnalyzeAggregationType, 'RAW' | string> = {
  raw: 'RAW',
  count: 'COUNT',
  countDistinct: 'COUNT(DISTINCT %s)',
  sum: 'SUM',
  avg: 'AVG',
  max: 'MAX',
  min: 'MIN'
}

/**
 * 排序方向到 SQL 排序关键字的映射表
 * @type {Record<AnalyzeOrderDirection, 'ASC' | 'DESC'>}
 */
const ORDER_DIRECTION_TO_SQL: Record<AnalyzeOrderDirection, 'ASC' | 'DESC'> = {
  asc: 'ASC',
  desc: 'DESC'
}

/**
 * 单次查询最大限制条数
 * @type {number}
 */
const MAX_QUERY_LIMIT = 5000

/**
 * 日期时间格式化 SQL 字符串模板
 * @type {string}
 */
const ANALYZE_DATETIME_SQL_FORMAT = '%Y-%m-%d %H:%i:%s'

/**
 * 空的筛选子句结构默认值
 * @type {FilterClauseFragments}
 */
const EMPTY_FILTER_CLAUSES: FilterClauseFragments = {
  where: { sql: '', params: [] },
  having: { sql: '', params: [] }
}

/**
 * 判断指定列的类型是否为日期/时间类型
 * @param {string} [columnType] 数据库列类型
 * @returns {boolean} 是否为日期或时间类型
 */
const isDateTimeColumnType = (columnType?: string) => {
  const normalizedColumnType = columnType?.toLowerCase() || ''
  return ['date', 'datetime', 'timestamp', 'time', 'year', 'datetime2', 'datetimeoffset', 'smalldatetime'].some(
    (type) => normalizedColumnType.includes(type)
  )
}

// ---------------------------------------------------------------------------
// 自定义表达式安全
// ---------------------------------------------------------------------------

/**
 * 自定义表达式中允许使用的白名单 SQL 函数
 * @type {Set<string>}
 */
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

/**
 * 检测自定义表达式中是否存在危险 SQL 关键字或特殊字符的正则表达式
 * @type {RegExp}
 */
const DANGEROUS_EXPRESSION_PATTERN =
  /(;|--|#|\/\*|\*\/|\b(select|from|where|union|join|insert|update|delete|drop|alter|truncate|grant|revoke|create|into|outfile|load_file|benchmark|sleep|handler)\b)/i

/**
 * 分析页 SQL 查询构建器，负责将前端图表配置（维度、指标、筛选、排序）安全地转化为可执行的 SQL 语句
 */
export class AnalyzeQueryBuilder {
  // -------------------------------------------------------------------------
  // 对外 API
  // -------------------------------------------------------------------------

  /**
   * 规范化标识符（如字段名），防范 SQL 注入，转换为蛇形命名
   * @param {string} identifier 待规范化的标识符
   * @param {string} label 标识符描述标签（用于报错信息）
   * @returns {string} 规范化后的蛇形命名标识符
   * @throws {Error} 标识符为空或不符合 [a-z0-9_] 规则时抛出异常
   */
  public normalizeIdentifier(identifier: string, label: string): string {
    const normalizedIdentifier = toLine(String(identifier || '').trim())
    if (!normalizedIdentifier || !/^[a-z0-9_]+$/i.test(normalizedIdentifier)) {
      throw new Error(`${label}非法: ${identifier}`)
    }
    return normalizedIdentifier
  }

  /**
   * 为标识符加上反引号
   * @param {string} identifier 标识符
   * @returns {string} 加反引号后的标识符
   */
  public quoteIdentifier(identifier: string): string {
    return `\`${identifier}\``
  }

  /**
   * 限制和规范化查询条数 limit 值
   * @param {number} [limit] 限制条数值
   * @returns {number} 规范化后的 limit 值，范围在 [1, MAX_QUERY_LIMIT]，默认 1000
   */
  public normalizeLimit(limit?: number): number {
    const numericLimit = Number(limit)
    if (!Number.isFinite(numericLimit)) {
      return 1000
    }
    return Math.min(Math.max(Math.floor(numericLimit), 1), MAX_QUERY_LIMIT)
  }

  /**
   * 构建分析图表的完整数据查询 SQL 语句与参数
   * @param {AnalyzeDataDto.AnalyzeDataQuery} analyzeDataQuery 前端查询参数（指标、维度、筛选、排序等）
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {AnalyzeSqlQuery} 构建出的 SQL 及参数
   */
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

  /**
   * 构建 SELECT 子句
   * @private
   * @param {AnalyzeDataDto.MeasureOption[]} measures 指标/值字段配置数组
   * @param {DimensionFieldExpressions} dimensionFieldExpressions 维度字段的 SQL 表达式集合
   * @param {boolean} hasDimensions 是否配置了维度字段
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {string} SELECT 子句文本
   * @throws {Error} 未选择任何值或维度字段时抛出异常
   */
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

  /**
   * 构建 WHERE 和 HAVING 筛选条件子句及其绑定参数
   * @private
   * @param {AnalyzeDataDto.FilterOption[]} filterOptions 筛选字段配置数组
   * @param {boolean} hasDimensions 是否配置了维度字段
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {FilterClauseFragments} WHERE 与 HAVING 的子句及参数
   * @throws {Error} 进行了聚合筛选但未配置任何维度时抛出异常
   */
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

  /**
   * 构建 ORDER BY 排序子句
   * @private
   * @param {AnalyzeDataDto.OrderOption[]} orderOptions 排序配置数组
   * @param {boolean} hasDimensions 是否配置了维度字段
   * @param {DimensionFieldExpressions} dimensionFieldExpressions 维度字段的 SQL 表达式集合
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {string} ORDER BY 子句文本，未配置排序返回空字符串
   * @throws {Error} 聚合查询中值字段排序未指定聚合方式时抛出异常
   */
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

  /**
   * 批量构建维度字段表达式及对应映射 Map
   * @private
   * @param {AnalyzeDataDto.DimensionOption[]} dimensionOptions 维度字段配置数组
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {DimensionFieldExpressions} 维度表达式集合对象
   */
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

  /**
   * 构建单个维度的列名及 SQL 表达式
   * @private
   * @param {AnalyzeDataDto.DimensionOption} dimensionOption 维度字段配置
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {DimensionFieldExpression} 维度表达式对象
   */
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

  /**
   * 根据指定的聚合方式对字段表达式进行包装
   * @private
   * @param {AnalyzeAggregationType} aggregationType 聚合类型
   * @param {string} expression 字段原始表达式
   * @returns {string} 包装后的聚合 SQL 表达式
   */
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

  /**
   * 获取值字段配置的聚合类型
   * @private
   * @param {object} option 值字段指标配置对象
   * @param {object} [option.measureRule] 规则对象
   * @param {AnalyzeMeasureAggregationType} [option.measureRule.aggregation] 指标配置的聚合方式
   * @returns {AnalyzeMeasureAggregationType} 聚合方式
   * @throws {Error} 值字段未配置聚合方式时抛出异常
   */
  private resolveMeasureAggregationType(option: {
    measureRule?: {
      aggregation?: AnalyzeMeasureAggregationType
    }
  }): AnalyzeMeasureAggregationType {
    const configuredAggregation = option.measureRule?.aggregation
    if (configuredAggregation) {
      return configuredAggregation
    }

    throw new Error('聚合查询中，值字段需要选择总计、计数、平均等聚合方式')
  }

  /**
   * 规范化并获取配置的聚合类型名称
   * @private
   * @param {string} [aggregation] 配置的聚合属性名
   * @returns {AnalyzeAggregationType} 聚合类型枚举值
   * @throws {Error} 传入了不支持的聚合类型时抛出异常
   */
  private resolveRuleAggregationType(aggregation?: string): AnalyzeAggregationType {
    const configuredAggregation = (aggregation || 'raw') as AnalyzeAggregationType
    if (!(configuredAggregation in ANALYZE_AGGREGATION_SQL_MAP)) {
      throw new Error(`不支持的聚合类型: ${aggregation}`)
    }

    return configuredAggregation
  }

  /**
   * 针对日期时间类型的列，使用 DATE_FORMAT 进行格式化包装，非日期类型直接返回
   * @private
   * @param {string} [columnType] 字段在数据库中的列类型
   * @param {string} expression 字段原始 SQL 表达式
   * @returns {string} 包装后的 SQL 表达式
   */
  private formatDateTimeExpression(columnType: string | undefined, expression: string): string {
    return isDateTimeColumnType(columnType)
      ? `DATE_FORMAT(${expression}, '${ANALYZE_DATETIME_SQL_FORMAT}')`
      : expression
  }

  /**
   * 拼接 SQL 查询的列别名格式（AS `column_name`）
   * @private
   * @param {string} expression 列的 SQL 表达式
   * @param {string} columnName 原有列名标识符
   * @returns {string} 拼接 AS 别名后的表达式
   */
  private formatSelectAlias(expression: string, columnName: string): string {
    return `${expression} AS ${this.quoteIdentifier(columnName)}`
  }

  // -------------------------------------------------------------------------
  // 字段解析
  // -------------------------------------------------------------------------

  /**
   * 解析某个列项的名称及其对应的安全查询表达式（处理自定义 SQL 情况）
   * @private
   * @param {AnalyzeConfigDao.ColumnItem} option 列配置对象
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {{ columnName: string, expression: string }} 包含列名和对应 SQL 表达式的对象
   */
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

  /**
   * 解析某个列项的 SQL 查询表达式
   * @private
   * @param {AnalyzeConfigDao.ColumnItem} option 列配置对象
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {string} SQL 查询表达式
   */
  private resolveExpression(option: AnalyzeConfigDao.ColumnItem, context: AnalyzeQueryContext): string {
    return this.resolveFieldExpression(option, context).expression
  }

  /**
   * 为指定的合法列名添加反引号包装
   * @private
   * @param {string} columnName 列名标识符
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {string} 加反引号包装后的安全列名
   */
  private quoteAllowedColumn(columnName: string, context: AnalyzeQueryContext): string {
    const normalizedColumnName = this.normalizeIdentifier(columnName, '字段')
    this.assertAllowedColumn(normalizedColumnName, columnName, context)
    return this.quoteIdentifier(normalizedColumnName)
  }

  /**
   * 断言检查某字段是否包含在当前上下文的允许字段集中（防 SQL 注入）
   * @private
   * @param {string} normalizedColumnName 规范化后的字段列名
   * @param {string} columnName 原始列名（用于报错提示）
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {void}
   * @throws {Error} 字段不存在或不允许查询时抛出异常
   */
  private assertAllowedColumn(normalizedColumnName: string, columnName: string, context: AnalyzeQueryContext): void {
    if (!context.allowedColumns.has(normalizedColumnName)) {
      throw new Error(`字段不存在或不允许查询: ${columnName}`)
    }
  }

  // -------------------------------------------------------------------------
  // 自定义表达式消毒
  // -------------------------------------------------------------------------

  /**
   * 对自定义 SQL 表达式进行语法过滤、消毒与校验，仅允许合法的列与白名单函数，并自动为列标识符加上反引号
   * @private
   * @param {string} expression 自定义 SQL 表达式
   * @param {AnalyzeQueryContext} context 分析查询上下文
   * @returns {string} 消毒/规范化包装后的安全 SQL 表达式
   * @throws {Error} 表达式为空、过长、含有危险关键字或不支持字符时抛出异常
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

  /**
   * 剥离并提取自定义表达式中的字符串字面量（用占位符 __LITERAL_x__ 替换，防关键字混淆）
   * @private
   * @param {string} expression 原始自定义表达式
   * @returns {{ sanitizedExpression: string, literals: string[] }} 剥离后的表达式及字符串字面量数组
   * @throws {Error} 字符串字面量未闭合时抛出异常
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
   * 还原自定义表达式中之前被剥离的字符串字面量
   * @private
   * @param {string} expression 用占位符替换过的表达式
   * @param {string[]} literals 字符串字面量数组
   * @returns {string} 完整还原后的 SQL 表达式
   */
  private restoreStringLiterals(expression: string, literals: string[]): string {
    return expression.replace(/__LITERAL_(\d+)__/g, (_full, indexText: string) => literals[Number(indexText)] || '')
  }
}
