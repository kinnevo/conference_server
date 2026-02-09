import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { getActiveProvider, getProviderByIdInternal } from '../services/llmProviderService';
import { getPromptByName } from '../services/promptService';
import { testConnection } from '../services/llm/openaiProvider';
import { saveSignal, getAllSignals, getUserSignals, deleteSignal } from '../services/signalService';
import { getSignalSourceMode } from '../services/systemSettingsService';

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

// Cluster signals using the active LLM provider
router.post('/cluster', async (req: AuthRequest, res: Response) => {
  try {
    const { signals, selectedField, includeWeak } = req.body;

    if (!signals || !Array.isArray(signals) || signals.length === 0) {
      res.status(400).json({ error: 'At least one signal is required' });
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

    const provider = await getProviderByIdInternal(activeProvider.id);
    if (!provider || !provider.api_key_encrypted) {
      res.status(400).json({ error: 'LLM provider not properly configured' });
      return;
    }

    if (provider.name !== 'openai') {
      res.status(400).json({ error: 'Only OpenAI provider is supported for clustering' });
      return;
    }

    // Try DB prompt first, fall back to inline
    let systemPrompt: string;
    const dbPrompt = await getPromptByName('cluster_generation');
    if (dbPrompt) {
      systemPrompt = dbPrompt.content;
    } else {
      systemPrompt = `You are an expert pattern recognition analyst specializing in clustering innovation signals.

Your task: Analyze the provided signals and identify 3-7 distinct clusters of related patterns.

For each cluster, provide a JSON object with:
{
  "title": "Short, descriptive cluster name (3-6 words)",
  "insight": "One crisp paragraph (2-3 sentences) describing what's happening in reality",
  "strength": "high" | "medium" | "low",
  "signalIds": ["id1", "id2", ...],
  "patternTags": ["tag1", "tag2", ...],
  "opportunityPreview": {
    "whoIsStruggling": "Brief description of affected users",
    "desiredOutcome": "What they're trying to achieve",
    "whatBreaks": "What's not working today",
    "costOfInaction": "Estimated impact if not addressed"
  }
}

Guidelines:
- Create 3-7 clusters (not more, not less). If fewer than 3 clusters are meaningful, create exactly 3 by grouping loosely related signals.
- Each signal should belong to exactly one cluster
- Cluster strength: high = 4+ signals with consistent pattern, medium = 2-3 signals, low = emerging pattern
- Pattern tags should be specific, not generic (e.g., "Reverts to old workflow" not "User behavior")
- Insight should be observational, not prescriptive
- Opportunity preview frames the problem, not the solution
- CRITICAL: Use the exact signal IDs provided in the input — do not invent or modify them

Return ONLY a valid JSON array of cluster objects, no additional text or markdown formatting.`;
    }

    // Format signals as user message
    const signalsText = signals.map((s: any, idx: number) =>
      `Signal ${idx + 1} (ID: ${s.id}):\nInput: ${s.inputSignal}\nOutcome: ${s.outcome}\nTypes: ${(s.signalTypes || []).join(', ')}\nReasoning: ${(s.reasoning || []).join('; ')}`
    ).join('\n\n');

    const userMessage = `Field of Interest: ${selectedField || 'All fields'}\nNumber of Signals: ${signals.length}\nInclude Weak Signals: ${includeWeak ? 'Yes' : 'No'}\n\nSignals to cluster:\n${signalsText}\n\nGenerate clusters for these signals.`;

    const OpenAI = require('openai').default;
    const { getProviderApiKey } = require('../services/llmProviderService');

    const apiKey = getProviderApiKey(provider);
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: provider.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: parseFloat(provider.temperature as any) || 0.7,
      max_tokens: parseInt(provider.max_tokens as any) || 4000
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    res.json({ rawResponse, model: provider.model });
  } catch (error: any) {
    console.error('Cluster generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate clusters'
    });
  }
});

// Get signals - admins see all, regular users see only their own
// Uses global system-wide signal source mode (demo or live)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Fetch global signal source mode from database
    const mode = await getSignalSourceMode();

    // Admin users see all signals with user info, regular users see only their own
    const signals = req.user?.isAdmin
      ? await getAllSignals(mode)
      : await getUserSignals(req.user!.userId, mode);

    res.json(signals);
  } catch (error: any) {
    console.error('Get signals error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch signals' });
  }
});

// Save or update a signal (any authenticated user)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    // Fetch global signal source mode from database
    const mode = await getSignalSourceMode();
    const { id, sessionId, fieldOfInterest, title, description, qualificationLevel, validationResult } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Signal id is required' });
      return;
    }

    const signal = await saveSignal({
      id,
      userId: req.user!.userId,
      sessionId,
      fieldOfInterest,
      title,
      description,
      qualificationLevel,
      validationResult
    }, mode);

    res.json(signal);
  } catch (error: any) {
    console.error('Save signal error:', error);
    res.status(500).json({ error: error.message || 'Failed to save signal' });
  }
});

// Delete a signal (any authenticated user)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Fetch global signal source mode from database
    const mode = await getSignalSourceMode();
    const deleted = await deleteSignal(req.params.id, mode);
    if (!deleted) {
      res.status(404).json({ error: 'Signal not found' });
      return;
    }
    res.status(204).send();
  } catch (error: any) {
    console.error('Delete signal error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete signal' });
  }
});

export default router;
