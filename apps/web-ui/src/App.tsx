import { useState } from 'react'
import { ConvexProvider } from 'convex/react'
import convex from './convex'
import { UrlManager } from './components/UrlManager'
import { ChatInterface } from './components/ChatInterface'
import { TabBar, Tab, Message } from './components/TabBar'

function App() {
  // Initialize with one default tab
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      name: 'Main',
      urls: [],
      messages: []
    }
  ])
  const [activeTabId, setActiveTabId] = useState('1')

  // Get the currently active tab
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0]

  const addUrl = (url: string) => {
    if (url && !activeTab.urls.includes(url)) {
      setTabs(prevTabs => prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, urls: [...tab.urls, url] }
          : tab
      ))
    }
  }

  const removeUrl = (url: string) => {
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, urls: tab.urls.filter(u => u !== url) }
        : tab
    ))
  }

  const updateTabMessages = (messages: Message[]) => {
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, messages }
        : tab
    ))
  }

  const handleTabSwitch = (tabId: string) => {
    setActiveTabId(tabId)
  }

  const handleTabCreate = () => {
    const newTabId = Date.now().toString()
    const newTab: Tab = {
      id: newTabId,
      name: `Tab ${tabs.length + 1}`,
      urls: [],
      messages: []
    }
    setTabs(prevTabs => [...prevTabs, newTab])
    setActiveTabId(newTabId)
  }

  const handleTabRename = (tabId: string, newName: string) => {
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, name: newName }
        : tab
    ))
  }

  const handleTabDelete = (tabId: string) => {
    if (tabs.length <= 1) return // Don't allow deleting the last tab
    
    setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId))
    
    // If we're deleting the active tab, switch to the first remaining tab
    if (tabId === activeTabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId)
      setActiveTabId(remainingTabs[0].id)
    }
  }

  return (
    <ConvexProvider client={convex}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center space-x-4">
              <img 
                src="/winternal-logo.svg" 
                alt="Winternal Logo" 
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Documentation Assistant
                </h1>
                <p className="text-gray-600 text-sm">
                  Add documentation URLs and chat with your AI assistant for code generation
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Bar */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSwitch={handleTabSwitch}
          onTabCreate={handleTabCreate}
          onTabRename={handleTabRename}
          onTabDelete={handleTabDelete}
        />

        <main className="max-w-7xl mx-auto px-4 py-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[320px]">
            {/* Left Column - URL Manager */}
            <div className="bg-white rounded-lg shadow-sm border flex flex-col">
              <div className="p-4 border-b flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  Documentation Sources
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Add URLs to your internal documentation for {activeTab.name}
                </p>
              </div>
              <div className="flex-1 min-h-0">
                <UrlManager 
                  urls={activeTab.urls}
                  onAddUrl={addUrl}
                  onRemoveUrl={removeUrl}
                />
              </div>
            </div>

            {/* Right Column - Chat Interface */}
            <div className="bg-white rounded-lg shadow-sm border flex flex-col">
              <div className="p-4 border-b flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Assistant
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Ask for code generation based on your documentation in {activeTab.name}
                </p>
              </div>
              <div className="flex-1 min-h-0">
                <ChatInterface 
                  urls={activeTab.urls} 
                  messages={activeTab.messages}
                  onMessagesUpdate={updateTabMessages}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ConvexProvider>
  )
}

export default App
