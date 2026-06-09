type AnalyzeErrorAiRequest = {
  sql?: string
  errorMessage?: string
  queryParams?: unknown
}

type AnalyzeErrorAiStreamMessage = {
  type: 'ai_chunk'
  content: string
}

type DeepSeekStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string
    }
  }>
}

const DEFAULT_DEEP_SEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEFAULT_DEEP_SEEK_MODEL = 'deepseek-chat'

const ANALYZE_ERROR_SYSTEM_PROMPT =
  '你是一个资深的数据分析师和SQL专家。用户执行数据分析查询失败了，请根据报错信息和脱敏后的查询上下文分析原因，并给出具体的修复建议。请直接给出结论，保持简洁。'

type SafeAnalyzeQueryField = {
  displayName: string
  columnType?: string
  aggregation?: string
  operator?: string
  hasOperand?: boolean
}

/**
 * @desc 分析查询错误的 AI 流式服务。
 */
export class AnalyzeErrorAiService {
  /**
   * @desc 生成前端消费的 NDJSON 分片流。
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
