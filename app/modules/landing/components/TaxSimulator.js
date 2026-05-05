'use client'

import { useState } from 'react'

export default function TaxSimulator() {
  const [annualIncome, setAnnualIncome] = useState('')
  const [currentInvestments, setCurrentInvestments] = useState('')
  const [results, setResults] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

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
    // Same formatting function as ConversationalCoach
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
      
      // Tables
      else if (line.includes('|') && line.split('|').length > 2) {
        if (inList) {
          result.push(isOrderedList ? '</ol>' : '</ul>')
          inList = false
          isOrderedList = false
        }
        
        if (!inTable) {
          result.push('<div class="overflow-x-auto my-4"><table class="min-w-full bg-white border border-slate-200 rounded-lg">')
          inTable = true
          
          let cells = line.split('|').map(cell => cell.trim()).filter(cell => cell)
          result.push('<thead class="bg-slate-50">')
          result.push('<tr>')
          cells.forEach(cell => {
            result.push(`<th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">${formatInlineMarkdown(cell)}</th>`)
          })
          result.push('</tr>')
          result.push('</thead>')
          result.push('<tbody>')
        } else {
          if (line.includes('---')) continue
          
          let cells = line.split('|').map(cell => cell.trim()).filter(cell => cell)
          result.push('<tr class="border-b border-slate-100">')
          cells.forEach((cell, index) => {
            let className = 'px-4 py-3 text-sm text-slate-700'
            if (index === 0) className += ' font-medium'
            result.push(`<td class="${className}">${formatInlineMarkdown(cell)}</td>`)
          })
          result.push('</tr>')
        }
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

  const handleSimulation = async () => {
    if (!annualIncome) {
      alert("Please enter your annual income.")
      return
    }

    setIsLoading(true)
    setShowResults(false)
    setResults('')

    try {
      const systemPrompt = `You are 'Zenith Tax Optimizer', an AI tool for Indian users. Analyze the following financial data and provide a personalized tax-saving strategy report.
        - The user is under the OLD tax regime.
        - The Section 80C limit is ₹1,50,000.
        - The standard deduction is ₹50,000.
        
        User Data:
        - Gross Annual Income: ₹${annualIncome}
        - Current Section 80C Investments: ₹${currentInvestments || 0}

        Provide a direct tax-saving strategy report in markdown with the following sections (do not include any introduction or greeting):
        1.  **Summary**: A brief overview of their current situation and potential savings.
        2.  **Section 80C Analysis**: Calculate the remaining investment potential under 80C. Suggest 3-4 specific investment options (like ELSS, PPF, NSC) to fill this gap, briefly explaining each.
        3.  **Beyond 80C**: Suggest at least two other common tax-saving options outside of 80C relevant to a salaried individual (e.g., NPS under 80CCD(1B), Health Insurance under 80D).
        4.  **Estimated Tax Calculation**: Provide a simple before-and-after table showing their estimated tax liability (1. Current, 2. After Recommended Investments). Use simplified Indian tax slabs for calculation.
        
        IMPORTANT: Conclude with the disclaimer: 'Disclaimer: This is a simplified simulation and not professional tax advice. Tax laws are complex. Please consult a chartered accountant.'`

      const responseText = await callGeminiApi(systemPrompt)
      const formattedResponse = formatResponse(responseText)
      setResults(formattedResponse)
      setShowResults(true)
    } catch (error) {
      console.error("Error in tax simulation:", error)
      setResults("<p class='text-red-600'>Sorry, an error occurred while generating your report. Please check your inputs and try again.</p>")
      setShowResults(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Input Form */}
      <div className="p-3 md:p-4">
        <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-4">
          Find Your Tax Savings
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="annual-income"
              className="block text-sm font-medium text-slate-700"
            >
              Your Gross Annual Income (₹)
            </label>
            <input
              type="number"
              id="annual-income"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
              placeholder="e.g., 1500000"
            />
          </div>
          <div>
            <label
              htmlFor="current-investments"
              className="block text-sm font-medium text-slate-700"
            >
              Your Current 80C Investments (₹)
            </label>
            <input
              type="number"
              id="current-investments"
              value={currentInvestments}
              onChange={(e) => setCurrentInvestments(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
              placeholder="e.g., 75000"
            />
          </div>
          <button
            onClick={handleSimulation}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-semibold px-4 md:px-5 py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center h-[50px] text-sm md:text-base"
          >
            {isLoading ? (
              <div className="loader"></div>
            ) : (
              <span>Analyze & Optimize</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Results Display */}
      <div className="h-48 sm:h-56 md:h-64 lg:h-80 overflow-y-auto p-2 md:p-3 lg:p-6 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 shadow-inner">
        {!showResults ? (
          <div className="text-slate-500 text-center flex flex-col justify-center h-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0z"
              />
            </svg>
            <p className="mt-2">
              Your personalized tax-saving report will appear here.
            </p>
          </div>
        ) : (
          <div 
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: results }}
          />
        )}
      </div>
    </div>
  )
}
