import { useState } from 'react'
import POForm from './components/POForm'
import PendingOrders from './components/PendingOrders'
import ConfirmedOrders from './components/ConfirmedOrders'
import { isConfigured } from './lib/supabase'
import { T } from './constants'

const TABS = [
  { id: 'create',    label: T.TAB_CREATE,    icon: '✏️' },
  { id: 'pending',   label: T.TAB_PENDING,   icon: '⏳' },
  { id: 'confirmed', label: T.TAB_CONFIRMED, icon: '✅' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('create')
  const [pendingRefresh, setPendingRefresh] = useState(0)

  function handleFormSubmit() {
    setPendingRefresh(n => n + 1)
    setActiveTab('pending')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="shadow-lg">
        <img src="/aregai-header.png" alt="AregAI" className="w-full block" />
      </header>

      {/* Tab nav */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Supabase setup warning */}
      {!isConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-4xl mx-auto text-sm text-amber-800">
            <strong>⚙️ {T.SETUP_WARN}</strong> Add your Supabase credentials to{' '}
            <code className="bg-amber-100 px-1 rounded">.env.local</code> and restart.
            Run <code className="bg-amber-100 px-1 rounded">supabase-setup.sql</code> to create the tables.
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'create' && (
          <POForm onSubmitted={handleFormSubmit} />
        )}
        {activeTab === 'pending' && (
          <PendingOrders key={pendingRefresh} />
        )}
        {activeTab === 'confirmed' && (
          <ConfirmedOrders />
        )}
      </main>
    </div>
  )
}
