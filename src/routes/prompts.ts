import express, { Response } from 'express';
import { getAllPrompts, getPromptById, updatePrompt } from '../services/promptService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();

// All routes require authentication and admin access
router.use(authenticateToken);
router.use(requireAdmin);

// Get all prompts
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const prompts = await getAllPrompts();
    res.json(prompts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get prompt by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prompt = await getPromptById(req.params.id);

    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    res.json(prompt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update prompt content
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;

    if (typeof content !== 'string') {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const prompt = await updatePrompt(req.params.id, content);
    res.json(prompt);
  } catch (error: any) {
    if (error.message === 'Prompt not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
