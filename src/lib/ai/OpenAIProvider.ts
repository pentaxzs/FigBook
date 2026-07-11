import type { AIProvider } from './AIProvider'
import { PROMPT, parseJSON } from './AIProvider'
import type { ParsedMetric } from '@/types'

export class OpenAIProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async parseImage(base64Image: string, mimeType: string): Promise<ParsedMetric[]> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
          ],
        }],
        max_tokens: 1000,
      }),
    })
    if (!response.ok) throw new Error(`OpenAI API 오류: ${response.status}`)
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    return parseJSON(text)
  }
}
