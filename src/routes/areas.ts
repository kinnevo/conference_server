import express, { Response } from 'express';
import { getAllAreas, getAreaById, createArea, updateArea, deleteArea } from '../services/areaService';
import { authenticateToken } from '../middleware/auth';
import { areaValidation } from '../middleware/validation';
import { AuthRequest } from '../types';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all areas
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const areas = await getAllAreas();
    res.json(areas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get area by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const area = await getAreaById(req.params.id);

    if (!area) {
      res.status(404).json({ error: 'Area not found' });
      return;
    }

    res.json(area);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new area
router.post('/', areaValidation, async (req: AuthRequest, res: Response) => {
  try {
    const area = await createArea(req.body.name);
    res.status(201).json(area);
  } catch (error: any) {
    // Handle duplicate area name
    if (error.code === '23505') {
      res.status(409).json({ error: 'Area already exists' });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// Update area
router.put('/:id', areaValidation, async (req: AuthRequest, res: Response) => {
  try {
    const area = await updateArea(req.params.id, req.body.name);
    res.json(area);
  } catch (error: any) {
    if (error.message === 'Area not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.code === '23505') {
      res.status(409).json({ error: 'Area name already exists' });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete area
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await deleteArea(req.params.id);
    res.json({ message: 'Area deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Area not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
