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
  '你是一个资深的数据分析师和SQL专家。用户执行SQL查询失败了，请分析报错原因，并给出具体的修复建议。请直接给出结论，保持简洁。\n\n重要提示：\n如果涉及到具体的字段，请根据查询参数中的 measures, dimensions, orders, filters 等信息，找到该字段对应的中文名称（label或name），并在建议中使用中文名称。例如，不要说 "COUNT(DISTINCT month)"，而要说 "COUNT(DISTINCT 月份(英文缩写))"。'

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
            send({ type: 'ai_chunk', content: 'AI 分析服务未配置，请设置 DEEPSEEK_API_KEY' })
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
    if (!apiKey) {
      return null
    }

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
            content: `报错信息：${request.errorMessage || ''}\n执行SQL：${request.sql || ''}\n查询参数：${JSON.stringify(request.queryParams ?? {})}`
          }
        ],
        stream: true
      })
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
