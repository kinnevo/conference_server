import OpenAI from 'openai';
import { LLMProvider, LLMTestResult } from '../../types';
import { getProviderApiKey } from '../llmProviderService';

export async function testConnection(provider: LLMProvider): Promise<LLMTestResult> {
  try {
    const apiKey = getProviderApiKey(provider);
    const openai = new OpenAI({ apiKey });

    const startTime = Date.now();

    await openai.chat.completions.create({
      model: provider.model,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10
    });

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      message: 'Connection successful',
      response_time_ms: responseTime
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Connection failed',
      error: error.message
    };
  }
}

export function getAvailableModels(): string[] {
  return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
}
