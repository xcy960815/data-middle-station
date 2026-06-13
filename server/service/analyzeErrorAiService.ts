/**
 * 分析查询错误 AI 服务请求参数
 * @typedef {object} AnalyzeErrorAiRequest
 * @property {string} [sql] 执行失败的 SQL 语句
 * @property {string} [errorMessage] 报错信息
 * @property {unknown} [queryParams] 查询参数上下文
 */
type AnalyzeErrorAiRequest = {
  sql?: string
  errorMessage?: string
  queryParams?: unknown
}

/**
 * AI 流式响应消息分片格式
 * @typedef {object} AnalyzeErrorAiStreamMessage
 * @property {'ai_chunk'} type 消息类型
 * @property {string} content AI 响应的文本分片内容
 */
type AnalyzeErrorAiStreamMessage = {
  type: 'ai_chunk'
  content: string
}

/**
 * DeepSeek 流式 API 返回的原始 Chunk 格式
 * @typedef {object} DeepSeekStreamChunk
 * @property {Array<{ delta?: { content?: string } }>} [choices] 响应的选择列表
 */
type DeepSeekStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string
    }
  }>
}

/**
 * 默认 DeepSeek API 地址
 * @type {string}
 */
const DEFAULT_DEEP_SEEK_API_URL = 'https://api.deepseek.com/chat/completions'

/**
 * 默认 DeepSeek 模型名称
 * @type {string}
 */
const DEFAULT_DEEP_SEEK_MODEL = 'deepseek-chat'

/**
 * AI 分析错误时的 System Prompt
 * @type {string}
 */
const ANALYZE_ERROR_SYSTEM_PROMPT =
  '你是一个资深的数据分析师和SQL专家。用户执行数据分析查询失败了，请根据报错信息和脱敏后的查询上下文分析原因，并给出具体的修复建议。请直接给出结论，保持简洁。'

/**
 * 脱敏后用于发送给 AI 的查询字段格式
 * @typedef {object} SafeAnalyzeQueryField
 * @property {string} displayName 字段展示名称
 * @property {string} [columnType] 字段在数据库中的类型
 * @property {string} [aggregation] 聚合方式
 * @property {string} [operator] 筛选条件操作符
 * @property {boolean} [hasOperand] 是否有筛选值
 */
type SafeAnalyzeQueryField = {
  displayName: string
  columnType?: string
  aggregation?: string
  operator?: string
  hasOperand?: boolean
}

/**
 * 分析查询错误的 AI 流式服务，用于将执行 SQL 时的错误信息通过 LLM (DeepSeek) 进行分析并流式输出
 */
export class AnalyzeErrorAiService {
  /**
   * 生成前端消费的 NDJSON 分片流，用以流式返回错误分析结果
   * @param {AnalyzeErrorAiRequest} request AI 诊断请求参数
   * @returns {ReadableStream<Uint8Array>} 编码为 Uint8Array 的 NDJSON 数据流
   */
  public streamAnalyzeError(request: AnalyzeErrorAiRequest): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: async (controller) => {
        const encoder = new TextEncoder()
        const send = (message: AnalyzeErrorAiStreamMessage) => {
          controller.enqueue(encoder.encode(JSON.stringify(message) + '\n'))
        }

        try {
          const aiResponse = await this.requestDeepSeekAnalyzeErrorStream(request)
          if (!aiResponse) {
            send({ type: 'ai_chunk', content: 'AI 分析服务未启用或未配置' })
            return
          }
          if (!aiResponse.ok || !aiResponse.body) {
            send({ type: 'ai_chunk', content: 'AI 服务暂时不可用' })
            return
          }

          await this.pipeDeepSeekStream(aiResponse, send)
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          send({ type: 'ai_chunk', content: `AI 分析失败: ${errorMessage}` })
        } finally {
          controller.close()
        }
      }
    })
  }

  /**
   * 发起 DeepSeek API 的流式请求
   * @private
   * @param {AnalyzeErrorAiRequest} request AI 诊断请求参数
   * @returns {Promise<Response | null>} Fetch API 响应对象，如果未启用 AI 则返回 null
   */
  private async requestDeepSeekAnalyzeErrorStream(request: AnalyzeErrorAiRequest): Promise<Response | null> {
    const runtimeConfig = useRuntimeConfig()
    const apiKey = runtimeConfig.deepSeekApiKey
    const isAnalyzeErrorAiEnabled = String(runtimeConfig.analyzeErrorAiEnabled ?? 'false') === 'true'
    if (!isAnalyzeErrorAiEnabled || !apiKey) {
      return null
    }
    const safeQueryParams = this.sanitizeQueryParams(request.queryParams)

    return await fetch(runtimeConfig.deepSeekApiUrl || DEFAULT_DEEP_SEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: runtimeConfig.deepSeekModel || DEFAULT_DEEP_SEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: ANALYZE_ERROR_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `报错信息：${request.errorMessage || ''}\n脱敏查询上下文：${JSON.stringify(safeQueryParams)}`
          }
        ],
        stream: true
      })
    })
  }

  /**
   * 脱敏并清洗查询参数以减少敏感信息泄露和降低 prompt 长度
   * @private
   * @param {unknown} queryParams 原始前端查询参数
   * @returns {Record<string, unknown>} 脱敏后的安全查询参数字典
   */
  private sanitizeQueryParams(queryParams: unknown): Record<string, unknown> {
    if (!queryParams || typeof queryParams !== 'object') {
      return {}
    }
    type SanitizableQuery = {
      analyzeId?: number
      dimensions?: Array<Record<string, unknown>>
      measures?: Array<Record<string, unknown>>
      filters?: Array<Record<string, unknown>>
      orders?: Array<Record<string, unknown>>
    }
    const query = queryParams as SanitizableQuery
    return {
      analyzeId: query.analyzeId,
      dimensions: this.sanitizeFields(query.dimensions),
      measures: this.sanitizeFields(query.measures),
      filters: this.sanitizeFields(query.filters, { includeOperator: true }),
      orders: this.sanitizeFields(query.orders)
    }
  }

  /**
   * 脱敏并清洗具体维度的字段列表配置
   * @private
   * @param {Array<Record<string, unknown>>} [fields] 字段配置数组
   * @param {object} [options={}] 清洗配置选项
   * @param {boolean} [options.includeOperator] 是否保留筛选操作符与是否有值字段
   * @returns {SafeAnalyzeQueryField[]} 脱敏后的字段属性列表
   */
  private sanitizeFields(
    fields: Array<Record<string, unknown>> | undefined,
    options: { includeOperator?: boolean } = {}
  ): SafeAnalyzeQueryField[] {
    if (!Array.isArray(fields)) {
      return []
    }
    const getRule = (field: Record<string, unknown>, key: string): Record<string, unknown> | undefined => {
      const value = field[key]
      return value != null && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined
    }
    return fields.map((field) => {
      const filterRule = getRule(field, 'filterRule')
      const measureRule = getRule(field, 'measureRule')
      const orderRule = getRule(field, 'orderRule')
      const displayName = String(field.displayName || field.columnComment || field.alias || '').trim() || '未命名字段'

      return {
        displayName,
        columnType: typeof field.columnType === 'string' ? field.columnType : undefined,
        aggregation: String(filterRule?.aggregation || measureRule?.aggregation || orderRule?.aggregation || ''),
        operator: options.includeOperator && typeof filterRule?.operator === 'string' ? filterRule.operator : undefined,
        hasOperand: options.includeOperator ? Boolean(filterRule?.operand) : undefined
      }
    })
  }

  /**
   * 管道化传输 DeepSeek 流数据并实时回调 send
   * @private
   * @param {Response} aiResponse DeepSeek 接口的 Response 对象
   * @param {(message: AnalyzeErrorAiStreamMessage) => void} send 发送分片的回调函数
   * @returns {Promise<void>}
   */
  private async pipeDeepSeekStream(
    aiResponse: Response,
    send: (message: AnalyzeErrorAiStreamMessage) => void
  ): Promise<void> {
    const reader = aiResponse.body?.getReader()
    if (!reader) {
      return
    }

    const decoder = new TextDecoder()
    let bufferedLine = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      bufferedLine += decoder.decode(value, { stream: true })
      const lines = bufferedLine.split('\n')
      bufferedLine = lines.pop() || ''

      for (const line of lines) {
        this.sendDeepSeekDataLine(line, send)
      }
    }

    if (bufferedLine) {
      this.sendDeepSeekDataLine(bufferedLine, send)
    }
  }

  /**
   * 校验并提取 DeepSeek 流中的 data 数据行，解析为 JSON 后回调发送
   * @private
   * @param {string} line 原始行文本
   * @param {(message: AnalyzeErrorAiStreamMessage) => void} send 发送分片的回调函数
   * @returns {void}
   */
  private sendDeepSeekDataLine(line: string, send: (message: AnalyzeErrorAiStreamMessage) => void): void {
    const normalizedLine = line.trim()
    if (!normalizedLine.startsWith('data: ')) {
      return
    }

    const jsonStr = normalizedLine.slice(6).trim()
    if (!jsonStr || jsonStr === '[DONE]') {
      return
    }

    try {
      const json = JSON.parse(jsonStr) as DeepSeekStreamChunk
      const content = json.choices?.[0]?.delta?.content
      if (content) {
        send({ type: 'ai_chunk', content })
      }
    } catch (_error) {
      // DeepSeek 流里可能混入非 JSON 行，忽略后继续消费后续分片。
    }
  }
}

export type { AnalyzeErrorAiRequest }
