import { useState, useCallback, useRef } from 'react'
import { aiApi } from '../services/aiApi'

export function useAIChat() {
  const [messages,      setMessages]      = useState([])
  const [isStreaming,   setIsStreaming]   = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const abortRef = useRef(null)

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isStreaming) return

    const userMsg = { role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)
    setStreamingText('')

    try {
      const response = await aiApi.startChat(
        text.trim(),
        messages.map((m) => ({ role: m.role, content: m.content }))
      )

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        if (response.status === 429) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: "You've reached the request limit. Please wait a moment and try again! ⏳" },
          ])
        } else {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: "Sorry, I couldn't process that right now. Please try again! 🙏" },
          ])
        }
        return
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let   full             = ''
      let   pendingRecs      = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw   = decoder.decode(value, { stream: true })
        const lines = raw.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) {
              full = "Sorry, something went wrong. Please try again! 🙏"
              break
            }
            if (parsed.text) {
              full += parsed.text
              setStreamingText(full)
            }
            // Structured item cards sent by the server after the text stream
            if (Array.isArray(parsed.recommendations)) {
              pendingRecs = parsed.recommendations
            }
          } catch {
            // partial JSON chunk — skip
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role:            'assistant',
          content:         full || "I couldn't come up with a response. Try rephrasing!",
          recommendations: pendingRecs.length ? pendingRecs : undefined,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Oops! Something went wrong. Please check your connection and try again. 🌐" },
      ])
    } finally {
      setIsStreaming(false)
      setStreamingText('')
    }
  }, [messages, isStreaming])

  const clearConversation = useCallback(() => {
    setMessages([])
    setIsStreaming(false)
    setStreamingText('')
  }, [])

  return { messages, isStreaming, streamingText, sendMessage, clearConversation }
}
