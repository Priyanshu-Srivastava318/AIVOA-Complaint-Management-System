import { Sparkles } from 'lucide-react'
import FileUpload from './FileUpload'
import ChatBox from './ChatBox'

export default function AIAssistantPanel() {
  return (
    <aside className="w-[380px] shrink-0 border-l border-gray-200 bg-white flex flex-col h-full px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">AI Complaint Intake Assistant</h2>
        </div>
        <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">BETA</span>
      </div>

      <FileUpload />

      <div className="mt-4 flex-1 min-h-0 flex flex-col">
        <ChatBox />
      </div>
    </aside>
  )
}
