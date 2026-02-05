import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { getActiveProvider, getProviderByIdInternal } from '../services/llmProviderService';
import { getPromptByName } from '../services/promptService';
import { testConnection } from '../services/llm/openaiProvider';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validate a signal using the active LLM provider
router.post('/validate', async (req: AuthRequest, res: Response) => {
  try {
    const { signalCandidate, fieldOfInterest } = req.body;

    if (!signalCandidate) {
      res.status(400).json({ error: 'Signal candidate is required' });
      return;
    }

    // Get active LLM provider
    const activeProvider = await getActiveProvider();
    if (!activeProvider || !activeProvider.is_enabled) {
      res.status(400).json({
        error: 'No active LLM provider configured. Please configure an LLM provider in Settings.'
      });
      return;
    }

    // Get the full provider with encrypted data
    const provider = await getProviderByIdInternal(activeProvider.id);
    if (!provider || !provider.api_key_encrypted) {
      res.status(400).json({ error: 'LLM provider not properly configured' });
      return;
    }

    // Only support OpenAI for now
    if (provider.name !== 'openai') {
      res.status(400).json({ error: 'Only OpenAI provider is supported for signal validation' });
      return;
    }

    // Get the signal_analysis prompt
    const prompt = await getPromptByName('signal_analysis');
    if (!prompt) {
      res.status(500).json({ error: 'Signal analysis prompt not found' });
      return;
    }

    // Call OpenAI API
    const OpenAI = require('openai').default;
    const { getProviderApiKey } = require('../services/llmProviderService');

    const apiKey = getProviderApiKey(provider);
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: provider.model,
      messages: [
        {
          role: 'system',
          content: prompt.content
        },
        {
          role: 'user',
          content: `INPUT SIGNAL CANDIDATE\n\nField of Interest: ${fieldOfInterest}\n\n<<<\n${signalCandidate}\n>>>`
        }
      ],
      temperature: parseFloat(provider.temperature as any) || 0.7,
      max_tokens: parseInt(provider.max_tokens as any) || 4000
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    console.log('===== OpenAI Response =====');
    console.log(rawResponse);
    console.log('===========================');

    res.json({
      rawResponse,
      model: provider.model,
      fieldOfInterest
    });
  } catch (error: any) {
    console.error('Signal validation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to validate signal'
    });
  }
});

export default router;
