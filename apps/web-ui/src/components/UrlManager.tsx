import { useState } from 'react'

interface UrlManagerProps {
  urls: string[]
  onAddUrl: (url: string) => void
  onRemoveUrl: (url: string) => void
}

export function UrlManager({ urls, onAddUrl, onRemoveUrl }: UrlManagerProps) {
  const [inputUrl, setInputUrl] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputUrl.trim()) return

    setIsValidating(true)
    
    try {
      // Basic URL validation
      new URL(inputUrl.trim())
      onAddUrl(inputUrl.trim())
      setInputUrl('')
    } catch (error) {
      alert('Please enter a valid URL')
    } finally {
      setIsValidating(false)
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    // Could add a toast notification here
  }

  return (
    <div className="flex flex-col h-full">
      {/* Add URL Form */}
      <div className="p-4 border-b bg-gray-50">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">
              Documentation URL
            </label>
            <input
              id="url-input"
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://docs.example.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isValidating}
            />
          </div>
          <button
            type="submit"
            disabled={!inputUrl.trim() || isValidating}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? 'Validating...' : 'Add URL'}
          </button>
        </form>
      </div>

      {/* URL List */}
      <div className="flex-1 overflow-y-auto">
        {urls.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="mb-2">📚</div>
            <p className="text-sm">No documentation URLs added yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add URLs to your internal documentation to get started
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {urls.map((url, index) => (
              <div
                key={index}
                className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {new URL(url).hostname}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {url}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <button
                    onClick={() => handleCopyUrl(url)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy URL"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onRemoveUrl(url)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove URL"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL Count */}
      {urls.length > 0 && (
        <div className="p-3 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {urls.length} documentation source{urls.length !== 1 ? 's' : ''} added
          </p>
        </div>
      )}
    </div>
  )
}
