/**
 * @desc AI 分析错误
 */
export default defineEventHandler(async (event) => {
  const { sql, errorMessage, queryParams } = await readBody(event)

  // 设置响应头为流式 NDJSON
  setResponseHeader(event, 'Content-Type', 'application/x-ndjson')
  setResponseHeader(event, 'Transfer-Encoding', 'chunked')

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (data: any) => controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))

      try {
        // 调用 DeepSeek AI 分析
        const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer sk-0b459fb9f3cf4c7d8ae0fd25595969d0'
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content:
                  '你是一个资深的数据分析师和SQL专家。用户执行SQL查询失败了，请分析报错原因，并给出具体的修复建议。请直接给出结论，保持简洁。\n\n重要提示：\n如果涉及到具体的字段，请根据查询参数中的 dimensions, groups, orders, filters 等信息，找到该字段对应的中文名称（label或name），并在建议中使用中文名称。例如，不要说 "COUNT(DISTINCT month)"，而要说 "COUNT(DISTINCT 月份(英文缩写))"。'
              },
              {
                role: 'user',
                content: `报错信息：${errorMessage}\n执行SQL：${sql}\n查询参数：${JSON.stringify(queryParams)}`
              }
            ],
            stream: true
          })
        })

        if (!aiResponse.ok) {
          send({ type: 'ai_chunk', content: 'AI 服务暂时不可用' })
          controller.close()
          return
        }

        const reader = aiResponse.body?.getReader()
        const decoder = new TextDecoder()

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6)
                if (jsonStr === '[DONE]') continue
                try {
                  const json = JSON.parse(jsonStr)
                  const content = json.choices[0]?.delta?.content
                  if (content) {
                    send({ type: 'ai_chunk', content })
                  }
                } catch (e) {}
              }
            }
          }
        }
      } catch (aiError: any) {
        send({ type: 'ai_chunk', content: `AI 分析失败: ${aiError.message}` })
      } finally {
        controller.close()
      }
    }
  })

  return sendStream(event, stream)
})
