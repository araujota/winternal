import { useState } from 'react'
import { UrlManager } from './components/UrlManager'
import { ChatInterface } from './components/ChatInterface'

function App() {
  const [urls, setUrls] = useState<string[]>([])

  const addUrl = (url: string) => {
    if (url && !urls.includes(url)) {
      setUrls([...urls, url])
    }
  }

  const removeUrl = (url: string) => {
    setUrls(urls.filter(u => u !== url))
  }

  return (
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

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Left Column - URL Manager */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Documentation Sources
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Add URLs to your internal documentation
              </p>
            </div>
            <UrlManager 
              urls={urls}
              onAddUrl={addUrl}
              onRemoveUrl={removeUrl}
            />
          </div>

          {/* Right Column - Chat Interface */}
          <div className="bg-white rounded-lg shadow-sm border flex flex-col">
            <div className="p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                AI Assistant
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Ask for code generation based on your documentation
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <ChatInterface urls={urls} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
