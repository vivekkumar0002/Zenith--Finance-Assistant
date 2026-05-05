import { NextResponse } from 'next/server'

const DEFAULT_MODEL = 'gemini-3-flash-preview'

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_API_KEY || ''
}

function getGeminiApiUrl(apiKey) {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
}

export async function POST(request) {
  try {
    const body = await request.json()
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'Prompt is required.' },
        { status: 400 }
      )
    }

    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'Gemini API key is not configured.' },
        { status: 500 }
      )
    }

    const response = await fetch(getGeminiApiUrl(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gemini request failed.',
          error: result?.error?.message || `Status ${response.status}`,
        },
        { status: response.status }
      )
    }

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
    if (text) {
      return NextResponse.json({ success: true, text })
    }

    if (result?.candidates?.[0]?.finishReason === 'SAFETY') {
      return NextResponse.json({
        success: true,
        text: 'I am unable to provide a response to this query. Please try a different topic related to personal finance.',
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid response structure from Gemini.' },
      { status: 502 }
    )
  } catch (error) {
    console.error('Error in ai-demo route:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate AI response.',
        error: error.message,
      },
      { status: 500 }
    )
  }
}