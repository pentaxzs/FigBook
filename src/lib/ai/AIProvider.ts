import type { ParsedMetric, Settings } from '@/types'
import { GeminiProvider } from './GeminiProvider'
import { OpenAIProvider } from './OpenAIProvider'
import { AnthropicProvider } from './AnthropicProvider'

export interface AIProvider {
  parseImage(base64Image: string, mimeType: string): Promise<ParsedMetric[]>
}

const PROMPT = `이 이미지에서 프로덕트 지표들을 모두 추출해주세요.
각 지표에 대해 다음 JSON 형식으로 반환하세요:
[
  {
    "name": "지표명 (예: MAU, 클릭률, DAU)",
    "value": "수치 값 (예: 15만, 3.2)",
    "unit": "단위 (예: 명, %, 건)",
    "base_date": "기준 날짜 YYYY-MM 형식 (확인 불가면 null)"
  }
]
확인할 수 없는 값은 null로 표시하세요. JSON 배열만 반환하세요.`

export { PROMPT }

export function createAIProvider(settings: Settings): AIProvider {
  const { ai_provider, api_keys } = settings
  const key = api_keys[ai_provider]
  if (!key) throw new Error(`${ai_provider} API 키가 설정되지 않았습니다`)

  switch (ai_provider) {
    case 'gemini':
      return new GeminiProvider(key)
    case 'openai':
      return new OpenAIProvider(key)
    case 'anthropic':
      return new AnthropicProvider(key)
  }
}

export function parseJSON(text: string): ParsedMetric[] {
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    return JSON.parse(match[0]) as ParsedMetric[]
  } catch {
    return []
  }
}
