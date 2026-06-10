const FORBIDDEN_SQL_PATTERN =
  /\b(insert|update|delete|drop|alter|create|truncate|replace|grant|revoke|call|load_file|outfile|dumpfile)\b/i

/**
 * @desc 移除 SQL 注释，用于只读校验
 */
const stripSqlComments = (sql: string) => {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
}

/**
 * @desc 校验数据集 SQL 仅允许只读 SELECT
 */
export const assertReadOnlyDatasetSql = (sql: string) => {
  const trimmed = String(sql || '').trim()
  if (!trimmed) {
    throw new Error('SQL 不能为空')
  }

  const normalized = stripSqlComments(trimmed)
  if (!/^\s*select\b/i.test(normalized)) {
    throw new Error('仅支持 SELECT 查询')
  }
  if (FORBIDDEN_SQL_PATTERN.test(normalized)) {
    throw new Error('SQL 包含不允许的操作')
  }

  const statements = normalized
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
  if (statements.length > 1) {
    throw new Error('不支持多条 SQL 语句')
  }

  return normalized
}

/**
 * @desc 将用户 SQL 包装为预览查询
 */
export const buildDatasetPreviewSql = (querySql: string, limit: number) => {
  const safeLimit = Math.min(500, Math.max(1, Math.floor(limit)))
  const normalizedSql = assertReadOnlyDatasetSql(querySql)
  return `SELECT * FROM (${normalizedSql}) AS dataset_preview LIMIT ${safeLimit}`
}

/**
 * @desc 将用户 SQL 包装为分析查询 FROM 子句
 */
export const buildDatasetAnalyzeFromClause = (querySql: string) => {
  const normalizedSql = assertReadOnlyDatasetSql(querySql)
  return `(${normalizedSql}) AS dataset_query`
}
