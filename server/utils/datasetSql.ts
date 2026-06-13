const FORBIDDEN_SQL_PATTERN =
  /\b(insert|update|delete|drop|alter|create|truncate|replace|grant|revoke|call|load_file|outfile|dumpfile)\b/i

/**
 * 移除 SQL 语句中的单行 (--) 与多行注释，仅用于辅助只读语法分析校验
 * @param {string} sql 原始 SQL 语句
 * @returns {string} 过滤注释后的 SQL 语句
 */
const stripSqlComments = (sql: string) => {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
}

/**
 * 校验并限制数据集 SQL 仅允许只读 SELECT 查询，排查任何试图修改数据库结构的命令
 * @param {string} sql 待校验的 SQL 语句
 * @returns {string} 校验通过并去除注释后的规范化 SQL 语句
 * @throws {Error} 如果 SQL 为空、不以 SELECT 开头、包含非法写关键字或含有多条语句则抛出异常
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
 * 将用户数据集 SQL 语句包装为预览查询的子查询（自动限制返回行数）
 * @param {string} querySql 数据集 SQL 语句
 * @param {number} limit 预览行数限制
 * @returns {string} 构造好的用于预览的 SQL 语句
 */
export const buildDatasetPreviewSql = (querySql: string, limit: number) => {
  const safeLimit = Math.min(500, Math.max(1, Math.floor(limit)))
  const normalizedSql = assertReadOnlyDatasetSql(querySql)
  return `SELECT * FROM (${normalizedSql}) AS dataset_preview LIMIT ${safeLimit}`
}

/**
 * 将用户数据集 SQL 语句包装为分析查询的子查询 FROM 子句
 * @param {string} querySql 数据集 SQL 语句
 * @returns {string} 构造好的 FROM 子句 SQL 片段
 */
export const buildDatasetAnalyzeFromClause = (querySql: string) => {
  const normalizedSql = assertReadOnlyDatasetSql(querySql)
  return `(${normalizedSql}) AS dataset_query`
}
