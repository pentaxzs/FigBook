import type { AIProvider } from './AIProvider'
import { PROMPT, parseJSON } from './AIProvider'
import type { ParsedMetric } from '@/types'

export class AnthropicProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async parseImage(base64Image: string, mimeType: string): Promise<ParsedMetric[]> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    })
    if (!response.ok) throw new Error(`Anthropic API 오류: ${response.status}`)
    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    return parseJSON(text)
  }
}
