import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { getPromptByName } from '../services/promptService';
import { getActiveProvider, getProviderByIdInternal } from '../services/llmProviderService';
import { createIdea, getIdeasByOpportunity, getIdeasByUser, getAllIdeas } from '../services/ideaService';

const router = express.Router();

router.use(authenticateToken);

// Get ideas: by opportunity (query), all ideas (admin), or current user's ideas
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const opportunityId = req.query.opportunityId as string | undefined;
    if (opportunityId) {
      const ideas = await getIdeasByOpportunity(opportunityId);
      return res.json(ideas);
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Admin users see all ideas with author info, regular users see only their own
    const ideas = req.user?.isAdmin
      ? await getAllIdeas()
      : await getIdeasByUser(userId);

    res.json(ideas);
  } catch (error: any) {
    console.error('Get ideas error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch ideas' });
  }
});

// Generate ideas with AI (opportunity context + user message)
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { opportunityTitle, opportunityContentSummary, userMessage } = req.body;

    const activeProvider = await getActiveProvider();
    if (!activeProvider || !activeProvider.is_enabled) {
      res.status(400).json({
        error: 'No active LLM provider configured. Please configure an LLM provider in Settings.'
      });
      return;
    }

    const provider = await getProviderByIdInternal(activeProvider.id);
    if (!provider?.api_key_encrypted) {
      res.status(400).json({ error: 'LLM provider not properly configured' });
      return;
    }

    if (provider.name !== 'openai') {
      res.status(400).json({ error: 'Only OpenAI provider is supported' });
      return;
    }

    let systemContent = 'You help users brainstorm and develop ideas based on an opportunity. Respond with structured, actionable ideas. You may use JSON or clear sections.';
    const prompt = await getPromptByName('idea_generation');
    if (prompt?.content) {
      systemContent = prompt.content;
    }

    const userContent = `Opportunity: ${opportunityTitle || 'Untitled'}\n\nContext:\n${opportunityContentSummary || 'No additional context.'}\n\nUser request for ideas:\n${userMessage || 'Generate relevant ideas.'}`;

    const OpenAI = require('openai').default;
    const { getProviderApiKey } = require('../services/llmProviderService');
    const apiKey = getProviderApiKey(provider);
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: provider.model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent }
      ],
      temperature: parseFloat(provider.temperature as any) || 0.7,
      max_tokens: parseInt(provider.max_tokens as any) || 4000
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    res.json({
      rawResponse,
      model: provider.model
    });
  } catch (error: any) {
    console.error('Generate ideas error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate ideas'
    });
  }
});

// Save idea (opportunity_id, idea_input, result; user_id from auth)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { opportunityId, ideaInput, result } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!opportunityId?.trim() || !ideaInput?.trim() || !result?.trim()) {
      res.status(400).json({ error: 'opportunityId, ideaInput, and result are required' });
      return;
    }

    const idea = await createIdea({
      opportunityId: opportunityId.trim(),
      userId,
      ideaInput: ideaInput.trim(),
      result: result.trim()
    });

    res.status(201).json(idea);
  } catch (error: any) {
    console.error('Save idea error:', error);
    res.status(500).json({ error: error.message || 'Failed to save idea' });
  }
});

export default router;
