import { useState } from 'react'

export interface Tab {
  id: string
  name: string
  urls: string[]
  messages: Message[]
}

export interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string
  onTabSwitch: (tabId: string) => void
  onTabCreate: () => void
  onTabRename: (tabId: string, newName: string) => void
  onTabDelete: (tabId: string) => void
}

export function TabBar({ 
  tabs, 
  activeTabId, 
  onTabSwitch, 
  onTabCreate, 
  onTabRename, 
  onTabDelete 
}: TabBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleStartRename = (tab: Tab) => {
    setEditingTabId(tab.id)
    setEditingName(tab.name)
  }

  const handleFinishRename = () => {
    if (editingTabId && editingName.trim()) {
      onTabRename(editingTabId, editingName.trim())
    }
    setEditingTabId(null)
    setEditingName('')
  }

  const handleCancelRename = () => {
    setEditingTabId(null)
    setEditingName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishRename()
    } else if (e.key === 'Escape') {
      handleCancelRename()
    }
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {/* Existing Tabs */}
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center min-w-0 ${
                tab.id === activeTabId
                  ? 'border-b-2 border-blue-500'
                  : 'border-b-2 border-transparent hover:border-gray-300'
              }`}
            >
              <div
                className={`flex items-center px-4 py-3 cursor-pointer transition-colors min-w-0 ${
                  tab.id === activeTabId
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => onTabSwitch(tab.id)}
              >
                {editingTabId === tab.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={handleKeyDown}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 max-w-32"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm font-medium truncate max-w-32" title={tab.name}>
                    {tab.name}
                  </span>
                )}

                {/* Tab indicators */}
                <div className="flex items-center ml-2 space-x-1">
                  {tab.urls.length > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title={`${tab.urls.length} URLs`} />
                  )}
                  {tab.messages.length > 0 && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${tab.messages.length} messages`} />
                  )}
                </div>

                {/* Tab actions (visible on hover or when active) */}
                <div className={`flex items-center ml-2 space-x-1 ${
                  tab.id === activeTabId || editingTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity`}>
                  {editingTabId !== tab.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartRename(tab)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Rename tab"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  
                  {tabs.length > 1 && editingTabId !== tab.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onTabDelete(tab.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete tab"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add New Tab Button */}
          <button
            onClick={onTabCreate}
            className="flex items-center px-3 py-3 text-gray-400 hover:text-gray-600 transition-colors border-b-2 border-transparent hover:border-gray-300"
            title="Add new tab"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
