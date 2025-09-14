import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex-service/convex/_generated/api'
import { crawlSiteToPdf } from '../crawlToPdf'

// Type definition for URL objects from Convex
interface UrlObject {
  _id: string
  url: string
  title?: string
  description?: string
  tags?: string[]
  createdAt: number
  updatedAt: number
}

interface UrlManagerProps {
  urls: string[]
  onAddUrl: (url: string) => void
  onRemoveUrl: (url: string) => void
}

export function UrlManager({ urls, onAddUrl, onRemoveUrl }: UrlManagerProps) {
  const [inputUrl, setInputUrl] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [downloadingUrls, setDownloadingUrls] = useState<Set<string>>(new Set())
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredUrls, setFilteredUrls] = useState<UrlObject[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Convex hooks
  const addUrlMutation = useMutation((api as any).urls.addUrl)
  const allUrls = useQuery((api as any).urls.getAllUrls, { limit: 100 }) || []

  // Filter URLs based on input
  useEffect(() => {
    if (inputUrl.trim() && allUrls.length > 0) {
      const filtered = allUrls.filter((urlObj: UrlObject) => 
        urlObj.url.toLowerCase().includes(inputUrl.toLowerCase()) ||
        (urlObj.title && urlObj.title.toLowerCase().includes(inputUrl.toLowerCase()))
      ).slice(0, 5) // Limit to 5 suggestions
      setFilteredUrls(filtered)
      setShowDropdown(filtered.length > 0)
      setSelectedIndex(-1) // Reset selection when filtering
    } else {
      setFilteredUrls([])
      setShowDropdown(false)
      setSelectedIndex(-1)
    }
  }, [inputUrl, allUrls])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputUrl.trim()) return

    setIsValidating(true)
    
    try {
      // Basic URL validation
      new URL(inputUrl.trim())
      
      // Add to Convex database
      const result = await addUrlMutation({
        url: inputUrl.trim(),
        title: new URL(inputUrl.trim()).hostname,
        tags: ['user-added']
      })
      
      // Add to local state (for the current tab)
      onAddUrl(inputUrl.trim())
      setInputUrl('')
      setShowDropdown(false)
      
      // Show feedback
      if (result.existed) {
        console.log('URL already exists in database')
      } else {
        console.log('New URL added to database')
      }
    } catch (error) {
      alert('Please enter a valid URL')
    } finally {
      setIsValidating(false)
    }
  }

  const handleSelectFromDropdown = (selectedUrl: string) => {
    setInputUrl(selectedUrl)
    onAddUrl(selectedUrl)
    setInputUrl('')
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredUrls.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredUrls.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSelectFromDropdown(filteredUrls[selectedIndex].url)
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    // Could add a toast notification here
  }

  const handleDownloadPdf = async (url: string) => {
    if (downloadingUrls.has(url)) return
    
    setDownloadingUrls(prev => new Set(prev).add(url))
    
    try {
      // Generate a filename based on the URL hostname
      const hostname = new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '_')
      const filename = `${hostname}_docs.pdf`
      
      // Call the crawlSiteToPdf function
      await crawlSiteToPdf(url, filename, {
        maxPages: 50, // Reasonable limit for web UI
        waitMs: 500,  // Wait for JS content to load
        sameOriginOnly: true
      })
      
      // The file will be downloaded automatically by the browser
      alert(`PDF generated successfully! Check your downloads folder for ${filename}`)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDownloadingUrls(prev => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Add URL Form */}
      <div className="p-4 border-b bg-gray-50">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">
              Documentation URL
            </label>
            <input
              ref={inputRef}
              id="url-input"
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (filteredUrls.length > 0) setShowDropdown(true)
              }}
              placeholder="https://docs.example.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isValidating}
              autoComplete="off"
            />
            
            {/* Dropdown for previous URLs */}
            {showDropdown && filteredUrls.length > 0 && (
              <div 
                ref={dropdownRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                {filteredUrls.map((urlObj, index) => (
                  <button
                    key={urlObj._id}
                    type="button"
                    onClick={() => handleSelectFromDropdown(urlObj.url)}
                    className={`w-full px-3 py-2 text-left focus:outline-none border-b border-gray-100 last:border-b-0 ${
                      index === selectedIndex 
                        ? 'bg-blue-50 text-blue-900' 
                        : 'hover:bg-gray-50 focus:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate">
                        {urlObj.title || new URL(urlObj.url).hostname}
                      </span>
                      <span className="text-xs opacity-75 truncate">
                        {urlObj.url}
                      </span>
                    </div>
                  </button>
                ))}
                <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
                  {allUrls.length} URLs in database
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!inputUrl.trim() || isValidating}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? 'Adding...' : 'Add URL'}
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
                    onClick={() => handleDownloadPdf(url)}
                    disabled={downloadingUrls.has(url)}
                    className={`p-1 transition-colors ${
                      downloadingUrls.has(url)
                        ? 'text-blue-500 cursor-not-allowed'
                        : 'text-gray-400 hover:text-blue-600'
                    }`}
                    title={downloadingUrls.has(url) ? 'Generating PDF...' : 'Download as PDF'}
                  >
                    {downloadingUrls.has(url) ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
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
