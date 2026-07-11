import type { AIProvider } from './AIProvider'
import { PROMPT, parseJSON } from './AIProvider'
import type { ParsedMetric } from '@/types'

export class GeminiProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async parseImage(base64Image: string, mimeType: string): Promise<ParsedMetric[]> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: base64Image } },
            ],
          }],
        }),
      }
    )
    if (!response.ok) throw new Error(`Gemini API 오류: ${response.status}`)
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return parseJSON(text)
  }
}
