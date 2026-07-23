import { useState } from 'react'
import Header from './components/Header'
import ComplaintForm from './components/ComplaintForm'
import AIAssistantPanel from './components/AIAssistantPanel'
import Dashboard from './components/Dashboard'

export default function App() {
  const [view, setView] = useState('form') // 'form' | 'dashboard'

  return (
    <div className="h-screen flex flex-col">
      <Header view={view} onViewChange={setView} />
      <div className="flex flex-1 min-h-0">
        {view === 'form' ? (
          <>
            <ComplaintForm onSaved={() => setView('dashboard')} />
            <AIAssistantPanel />
          </>
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  )
}