import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Send, Bot, User } from 'lucide-react'
import { sendChatMessage, addUserMessage } from '../store/chatSlice'

export default function ChatBox() {
  const dispatch = useDispatch()
  const { messages, sending } = useSelector((s) => s.chat)
  const complaintId = useSelector((s) => s.complaints.form.id)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || sending) return
    dispatch(addUserMessage(input))
    dispatch(sendChatMessage({ message: input, complaintId }))
    setInput('')
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto thin-scroll space-y-3 py-4 px-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-brand-600" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {sending && <p className="text-xs text-gray-400 pl-8">AI Assistant is typing…</p>}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about this complaint..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={handleSend}
            disabled={sending}
            className="h-9 w-9 shrink-0 rounded-md bg-brand-600 flex items-center justify-center text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 text-center">AI responses may contain errors. Please verify information.</p>
      </div>
    </div>
  )
}
