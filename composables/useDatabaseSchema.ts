import { httpRequest } from '@/composables/useHttpRequest'
import type { DatabaseOption } from 'monaco-editor'

/**
 * 模块级缓存，避免在不同数据集页面间重复请求
 */
let cachedDatabaseOptions: DatabaseOption[] | null = null
let cachedTimestamp = 0
const CACHE_MAX_AGE = 5 * 60 * 1000 // 5 分钟，与服务端 Redis 缓存保持一致

/**
 * 将服务端返回的 Schema 数据转换为 Monaco Editor 所需的 DatabaseOption[] 格式
 * @param {DatasetVo.DatasetSchemaResponse} schema 服务端 Schema 响应
 * @returns {DatabaseOption[]} Monaco Editor 联想数据
 */
const transformSchemaToDatabaseOptions = (schema: DatasetVo.DatasetSchemaResponse): DatabaseOption[] => {
  return [
    {
      databaseName: schema.databaseName,
      tableOptions: schema.tables.map((table) => ({
        tableName: table.tableName,
        tableComment: table.tableComment,
        fieldOptions: table.columns.map((col) => ({
          fieldName: col.columnName,
          fieldType: col.columnType,
          fieldComment: col.columnComment,
          databaseName: schema.databaseName,
          tableName: table.tableName
        }))
      }))
    }
  ]
}

/**
 * 数据集 Schema 联想 Composable
 * 负责拉取数据库表/字段元数据并转换为 Monaco Editor 的 DatabaseOption 格式
 */
export function useDatabaseSchema() {
  const databaseOptions = ref<DatabaseOption[]>([])
  const schemaLoading = ref(false)

  const loadSchema = async () => {
    const now = Date.now()
    if (cachedDatabaseOptions && now - cachedTimestamp < CACHE_MAX_AGE) {
      databaseOptions.value = cachedDatabaseOptions
      return
    }

    schemaLoading.value = true
    try {
      const res = await httpRequest<ApiResponseI<DatasetVo.DatasetSchemaResponse>>('/api/getDatasetSchema', {
        method: 'POST'
      })
      if (res.code === 200 && res.data) {
        const options = transformSchemaToDatabaseOptions(res.data)
        databaseOptions.value = options
        cachedDatabaseOptions = options
        cachedTimestamp = now
      }
    } catch {
      // Schema 加载失败不阻塞编辑器使用，静默降级
    } finally {
      schemaLoading.value = false
    }
  }

  return {
    databaseOptions,
    schemaLoading,
    loadSchema
  }
}
