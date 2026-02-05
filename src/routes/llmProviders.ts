import express, { Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import {
  getAllProviders,
  getProviderById,
  getProviderByIdInternal,
  configureProvider,
  activateProvider,
  updateTestResult
} from '../services/llmProviderService';
import { testConnection, getAvailableModels } from '../services/llm/openaiProvider';

const router = express.Router();

// All routes require authentication and admin access
router.use(authenticateToken);
router.use(requireAdmin);

// Get all providers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const providers = await getAllProviders();
    res.json(providers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get provider by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const provider = await getProviderById(req.params.id);
    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }
    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Configure provider
router.post('/:id/configure', async (req: AuthRequest, res: Response) => {
  try {
    const { api_key, model, max_tokens, temperature, base_url } = req.body;

    if (!api_key || !model) {
      res.status(400).json({ error: 'API key and model are required' });
      return;
    }

    const provider = await configureProvider(req.params.id, {
      api_key,
      model,
      max_tokens,
      temperature,
      base_url
    });

    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test provider connection
router.post('/:id/test', async (req: AuthRequest, res: Response) => {
  try {
    // Use internal function to get provider WITH encrypted data
    const provider = await getProviderByIdInternal(req.params.id);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    if (provider.name !== 'openai') {
      res.status(400).json({ error: 'Only OpenAI is supported currently' });
      return;
    }

    const result = await testConnection(provider);
    await updateTestResult(req.params.id, result.success, result.error);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Activate provider
router.put('/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    const provider = await activateProvider(req.params.id);
    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get available models
router.get('/:id/models', async (req: AuthRequest, res: Response) => {
  try {
    const provider = await getProviderById(req.params.id);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    if (provider.name === 'openai') {
      res.json({ models: getAvailableModels() });
    } else {
      res.json({ models: [] });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
