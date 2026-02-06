import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { getPromptByName } from '../services/promptService';
import { getActiveProvider, getProviderByIdInternal } from '../services/llmProviderService';
import { createOpportunity, getAllOpportunities } from '../services/opportunityService';

const router = express.Router();

router.use(authenticateToken);

// Get all opportunities (any authenticated user)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const opportunities = await getAllOpportunities();
    res.json(opportunities);
  } catch (error: any) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch opportunities' });
  }
});

// Generate opportunity from cluster using opportunity_scoring prompt
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { cluster, userRequest } = req.body;

    if (!cluster?.title || !cluster?.insight) {
      res.status(400).json({ error: 'Cluster with title and insight is required' });
      return;
    }

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

    const prompt = await getPromptByName('opportunity_scoring');
    if (!prompt) {
      res.status(500).json({ error: 'Opportunity scoring prompt not found in Settings > Prompts' });
      return;
    }

    const userMessage = `Shape the following cluster into an opportunity.\n\nCluster title: ${cluster.title}\nCluster insight: ${cluster.insight}\n\nOpportunity preview:\n- Who is struggling: ${cluster.opportunityPreview?.whoIsStruggling || 'N/A'}\n- Desired outcome: ${cluster.opportunityPreview?.desiredOutcome || 'N/A'}\n- What breaks: ${cluster.opportunityPreview?.whatBreaks || 'N/A'}\n- Cost of inaction: ${cluster.opportunityPreview?.costOfInaction || 'N/A'}\n\n${userRequest ? `User request to shape the opportunity:\n${userRequest}` : 'Provide a structured opportunity description.'}`;

    const OpenAI = require('openai').default;
    const { getProviderApiKey } = require('../services/llmProviderService');
    const apiKey = getProviderApiKey(provider);
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: provider.model,
      messages: [
        { role: 'system', content: prompt.content },
        { role: 'user', content: userMessage }
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
    console.error('Generate opportunity error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate opportunity'
    });
  }
});

// Save opportunity (any authenticated user)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { clusterId, title, content, userRequest } = req.body;

    if (!title?.trim() || !content?.trim()) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    const opportunity = await createOpportunity({
      clusterId: clusterId || undefined,
      title: title.trim(),
      content: content.trim(),
      userRequest: userRequest?.trim() || undefined
    });

    res.status(201).json(opportunity);
  } catch (error: any) {
    console.error('Save opportunity error:', error);
    res.status(500).json({ error: error.message || 'Failed to save opportunity' });
  }
});

export default router;
