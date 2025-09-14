import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface ChatInterfaceProps {
  urls: string[]
}

export function ChatInterface({ urls }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingTimeout, setStreamingTimeout] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const resetStreamingTimeout = () => {
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current)
    }
    setStreamingTimeout(false)
    streamingTimeoutRef.current = setTimeout(() => {
      setStreamingTimeout(true)
    }, 3000)
  }

  const clearStreamingTimeout = () => {
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current)
      streamingTimeoutRef.current = null
    }
    setStreamingTimeout(false)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsProcessing(true)

    try {
      // First, let the user know we're processing their request
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `Processing your request with ${urls.length} documentation source${urls.length !== 1 ? 's' : ''}...\n\nWorkflow:\n1. Fetching and analyzing documentation\n2. Extracting relevant patterns and examples\n3. Generating code based on documentation conventions`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, systemMessage])

      // Create the assistant message that will be updated as content streams in
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      }

      // Remove system message and add streaming assistant message
      setMessages(prev => prev.filter(m => m.id !== systemMessage.id).concat([assistantMessage]))

      // Start the streaming timeout
      resetStreamingTimeout()

      // Call the agent workflow with streaming callback
      const response = await processAgentRequest(inputMessage.trim(), urls, (streamingContent: string) => {
        // Reset timeout whenever we receive new content
        resetStreamingTimeout()
        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: streamingContent, isStreaming: true }
            : m
        ))
      })
      
      // Mark streaming as complete and clear timeout
      clearStreamingTimeout()
      setMessages(prev => prev.map(m => 
        m.id === assistantMessage.id 
          ? { ...m, content: response, isStreaming: false }
          : m
      ))
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        timestamp: new Date()
      }
      setMessages(prev => prev.filter(m => m.type !== 'system').concat([errorMessage]))
    } finally {
      clearStreamingTimeout()
      setIsProcessing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="mb-4">🤖</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to help with code generation
            </h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              {urls.length > 0 
                ? `I have access to ${urls.length} documentation source${urls.length !== 1 ? 's' : ''}. Ask me to generate code based on your documentation!`
                : 'Add some documentation URLs first, then ask me to generate code based on your documentation!'
              }
            </p>
            {urls.length > 0 && (
              <div className="mt-4 text-xs text-gray-400">
                <p>Example requests:</p>
                <ul className="mt-2 space-y-1">
                  <li>"Create a React component that uses our API"</li>
                  <li>"Generate a function to authenticate users"</li>
                  <li>"Show me how to implement data validation"</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                  {message.isStreaming && (
                    streamingTimeout ? (
                      <div className="inline-block ml-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                      </div>
                    ) : (
                      <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">|</span>
                    )
                  )}
                </div>
                <div
                  className={`text-xs mt-1 opacity-70 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-gray-50 p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                urls.length > 0
                  ? "Ask me to generate code based on your documentation..."
                  : "Add documentation URLs first, then ask for code generation..."
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
              rows={3}
              disabled={isProcessing || urls.length === 0}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {urls.length === 0 ? (
                "Add documentation URLs to get started"
              ) : (
                `Ready to use ${urls.length} documentation source${urls.length !== 1 ? 's' : ''}`
              )}
            </div>
            <div className="flex space-x-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isProcessing}
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                disabled={!inputMessage.trim() || isProcessing || urls.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isProcessing ? 'Processing...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// API Configuration
const RUN_API_URL = (import.meta as any).env?.VITE_RUN_API_URL || 'http://localhost:3003'

// Helper function to clean system messages from content
function cleanSystemMessages(content: string): string {
  if (!content) return content
  
  // Remove data-operation messages that appear at the beginning or end
  let cleaned = content
  
  // Remove JSON data-operation messages
  cleaned = cleaned.replace(/\{"type":"data-operation"[^}]*\}/g, '')
  
  // Remove any remaining system messages patterns
  cleaned = cleaned.replace(/^[^a-zA-Z]*I'll help you/, "I'll help you")
  
  // Clean up any trailing system messages or incomplete JSON
  cleaned = cleaned.replace(/\{"type":"data-operation".*$/s, '')
  cleaned = cleaned.replace(/\{"type":"error".*$/s, '')
  
  // Trim whitespace and newlines
  cleaned = cleaned.trim()
  
  return cleaned
}

// Function to process agent requests using Inkeep's chat completions API
async function processAgentRequest(message: string, urls: string[], onStreamUpdate?: (content: string) => void): Promise<string> {
  try {
    // Use the direct chat completions endpoint with proper Inkeep formatting
    const response = await fetch(`${RUN_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a production environment, you would include authentication headers here
        // 'Authorization': 'Bearer YOUR_API_KEY',
        'x-inkeep-tenant-id': 'default',
        'x-inkeep-project-id': 'winternal',
        'x-inkeep-graph-id': 'librarian-graph'
      },
      body: JSON.stringify({
        model: 'librarian-graph', // Use the graph ID as the model
        messages: [
          {
            role: 'user',
            content: urls.length > 0 
              ? `Implement the following code generation request: ${message} using the ${urls.length > 1 ? 'libraries' : 'library'} documented at ${urls.join(', ')}`
              : `Implement the following code generation request: ${message}`
          }
        ],
        stream: true, // Enable streaming for better user experience
        requestContext: {
          documentationUrls: urls
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body received')
    }

    const decoder = new TextDecoder()
    let fullContent = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              return fullContent
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                const deltaContent = parsed.choices[0].delta.content
                
                // Filter out system/internal messages that shouldn't be shown to users
                if (!deltaContent.includes('"type":"data-operation"') && 
                    !deltaContent.includes('{"type":"data-operation"') &&
                    !deltaContent.startsWith('{"type":"data-operation"')) {
                  fullContent += deltaContent
                  // Call the streaming callback if provided
                  if (onStreamUpdate) {
                    const cleanedContent = cleanSystemMessages(fullContent)
                    onStreamUpdate(cleanedContent)
                  }
                }
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue
            }
          }
        }
      }

      // Clean up any remaining system messages from the final content
      const cleanedContent = cleanSystemMessages(fullContent)
      return cleanedContent || 'I received your request and am processing it with the documentation sources.'
    } finally {
      reader.releaseLock()
    }

  } catch (error) {
    console.error('Error processing agent request:', error)
    throw new Error(`Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
