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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

      // Call the agent workflow
      const response = await processAgentRequest(inputMessage.trim(), urls)
      
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => prev.filter(m => m.id !== systemMessage.id).concat([assistantMessage]))
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        timestamp: new Date()
      }
      setMessages(prev => prev.filter(m => m.type !== 'system').concat([errorMessage]))
    } finally {
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
      <div className="border-t bg-gray-50 p-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
const MANAGE_API_URL = import.meta.env.VITE_MANAGE_API_URL || 'http://localhost:3002'
const RUN_API_URL = import.meta.env.VITE_RUN_API_URL || 'http://localhost:3003'

// Function to process agent requests
async function processAgentRequest(message: string, urls: string[]): Promise<string> {
  try {
    // First, we need to create an agent session
    const sessionResponse = await fetch(`${MANAGE_API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentGraphId: 'librarian-graph',
        metadata: {
          documentationUrls: urls
        }
      })
    })

    if (!sessionResponse.ok) {
      throw new Error(`Failed to create session: ${sessionResponse.statusText}`)
    }

    const session = await sessionResponse.json()
    const sessionId = session.id

    // Now send the message to the agent
    const messageResponse = await fetch(`${RUN_API_URL}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `Please help me with this code generation request. I have provided ${urls.length} documentation URLs: ${urls.join(', ')}. 

User request: ${message}

Please:
1. Use your documentation tools to fetch and analyze the provided documentation
2. Extract relevant code examples and patterns from the documentation
3. Generate high-quality code that follows the documentation's conventions and best practices
4. Include proper imports, error handling, and comments
5. Provide explanations referencing specific parts of the documentation

The goal is to create code that matches the patterns and conventions shown in the provided documentation sources.`
      })
    })

    if (!messageResponse.ok) {
      throw new Error(`Failed to send message: ${messageResponse.statusText}`)
    }

    const messageResult = await messageResponse.json()
    return messageResult.content || 'I received your request and am processing it with the documentation sources.'

  } catch (error) {
    console.error('Error processing agent request:', error)
    throw new Error(`Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
