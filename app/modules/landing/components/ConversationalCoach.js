'use client'

import { useState } from 'react'

export default function ConversationalCoach() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "Hi! I'm Zenith. How can I help you with your finances today? Try asking about saving, investing, or taxes in India."
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const examplePrompts = [
    "Explain ETFs vs Mutual Funds",
    "How to save tax under 80C?",
    "Retirement planning for a 25-year-old"
  ]

  const callGeminiApi = async (prompt) => {
    const response = await fetch('/api/ai-demo', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API call failed with status: ${response.status}`)
    }
    
    const result = await response.json()

    if (result.success && result.text) {
      return result.text
    }

    throw new Error(result.message || "Invalid response structure from API.")
  }

  const formatResponse = (text) => {
    // Enhanced markdown to HTML converter
    let html = text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    
    let lines = html.split('\n')
    let result = []
    let inList = false
    let inTable = false
    let isOrderedList = false
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim()
      
      if (!line) {
        if (inList) {
          result.push(isOrderedList ? '</ol>' : '</ul>')
          inList = false
          isOrderedList = false
        }
        if (inTable) {
          result.push('</tbody></table></div>')
          inTable = false
        }
        result.push('<div class="mb-3"></div>')
        continue
      }
      
      // Headers
      if (line.startsWith('### ')) {
        if (inList) {
          result.push(isOrderedList ? '</ol>' : '</ul>')
          inList = false
          isOrderedList = false
        }
        if (inTable) {
          result.push('</tbody></table></div>')
          inTable = false
        }
        result.push(`<h3 class="text-lg font-bold text-slate-800 mt-6 mb-3">${formatInlineMarkdown(line.substring(4))}</h3>`)
      }
      else if (line.startsWith('## ')) {
        if (inList) {
          result.push(isOrderedList ? '</ol>' : '</ul>')
          inList = false
          isOrderedList = false
        }
        if (inTable) {
          result.push('</tbody></table></div>')
          inTable = false
        }
        result.push(`<h2 class="text-xl font-bold text-slate-800 mt-6 mb-4">${formatInlineMarkdown(line.substring(3))}</h2>`)
      }
      else if (line.startsWith('# ')) {
        if (inList) {
          result.push(isOrderedList ? '</ol>' : '</ul>')
          inList = false
          isOrderedList = false
        }
        if (inTable) {
          result.push('</tbody></table></div>')
          inTable = false
        }
        result.push(`<h1 class="text-2xl font-bold text-slate-800 mt-6 mb-4">${formatInlineMarkdown(line.substring(2))}</h1>`)
      }
      
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
        if (inTable) {
          result.push('</tbody></table></div>')
          inTable = false
        }
        
        if (!inList) {
          if (/^\d+\.\s/.test(line)) {
            result.push('<ol class="list-decimal list-inside space-y-2 my-4 ml-4">')
            isOrderedList = true
          } else {
            result.push('<ul class="list-disc list-inside space-y-2 my-4 ml-4">')
            isOrderedList = false
          }
          inList = true
        }
        
        let content = line.replace(/^(\d+\.\s|-\s|\*\s)/, '')
        result.push(`<li class="text-slate-700">${formatInlineMarkdown(content)}</li>`)
      }
      
      // Horizontal rule
      else if (line === '---') {
        if (inList) {
          result.push(isOrderedList ? '</ol>' : '</ul>')
          inList = false
          isOrderedList = false
        }
        if (inTable) {
          result.push('</tbody></table></div>')
          inTable = false
        }
        result.push('<hr class="my-6 border-slate-300">')
      }
      
      // Regular paragraphs
      else {
        if (inList) {
          result.push(isOrderedList ? '</ol>' : '</ul>')
          inList = false
          isOrderedList = false
        }
        if (inTable) {
          result.push('</tbody></table></div>')
          inTable = false
        }
        result.push(`<p class="text-slate-700 mb-4 leading-relaxed">${formatInlineMarkdown(line)}</p>`)
      }
    }
    
    if (inList) result.push(isOrderedList ? '</ol>' : '</ul>')
    if (inTable) result.push('</tbody></table></div>')
    
    return result.join('')
  }

  const formatInlineMarkdown = (text) => {
    return text
      .replace(/^#{1,6}\s+/, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/₹(\d+(?:,\d+)*)/g, '<span class="font-semibold text-green-600">₹$1</span>')
      .replace(/(\d+(?:\.\d+)?%)/g, '<span class="font-semibold text-blue-600">$1</span>')
  }

  const handleSendMessage = async () => {
    const query = input.trim()
    if (!query) return

    setMessages(prev => [...prev, { role: 'user', content: query }])
    setInput('')
    setIsLoading(true)

    try {
      const systemPrompt = `You are 'Zenith', a friendly and knowledgeable AI personal finance assistant for users in India. Provide helpful, educational, and general guidance. You are not a licensed financial advisor. Your answers should be clear, concise, and easy for a beginner to understand. Use markdown for formatting. IMPORTANT: Always include the following disclaimer at the end of your response, separated by a horizontal rule (---): 'Disclaimer: This is AI-generated guidance and not professional financial advice. Please consult with a qualified financial advisor for personalized advice.' Now, answer the user's question: "${query}"`

      const responseText = await callGeminiApi(systemPrompt)
      const formattedResponse = formatResponse(responseText)
      
      setMessages(prev => [...prev, { role: 'ai', content: formattedResponse, isHtml: true }])
    } catch (error) {
      console.error("Error in chat:", error)
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const handleExampleClick = (prompt) => {
    setInput(prompt)
  }

  return (
    <div>
      <div className="h-48 sm:h-56 md:h-64 lg:h-80 overflow-y-auto p-3 md:p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 shadow-inner flex flex-col space-y-3 mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-bubble ${message.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}
          >
            {message.isHtml ? (
              <div
                className="formatted-content"
                dangerouslySetInnerHTML={{ __html: message.content }}
              />
            ) : (
              message.content
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble ai-bubble">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2 justify-center">
        {examplePrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleExampleClick(prompt)}
            className="bg-slate-200 text-slate-700 text-sm px-3 py-1 rounded-full hover:bg-slate-300 transition"
          >
            {prompt}
          </button>
        ))}
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-grow w-full px-3 md:px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm md:text-base"
          placeholder="Ask a financial question..."
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className="bg-blue-600 text-white font-semibold px-4 md:px-5 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center h-[50px] w-full sm:w-[120px] text-sm md:text-base"
        >
          {isLoading ? (
            <div className="loader"></div>
          ) : (
            <span>Ask ✨</span>
          )}
        </button>
      </div>
    </div>
  )
}
