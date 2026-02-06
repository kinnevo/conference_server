import express, { Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import { saveClusters, getAllClusters, updateClusterTitle, deleteAllClusters } from '../services/clusterService';

const router = express.Router();

router.use(authenticateToken);

// Get all clusters (any authenticated user)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const clusters = await getAllClusters();
    res.json(clusters);
  } catch (error: any) {
    console.error('Get clusters error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch clusters' });
  }
});

// Save clusters (admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { clusters } = req.body;
    if (!clusters || !Array.isArray(clusters) || clusters.length === 0) {
      res.status(400).json({ error: 'At least one cluster is required' });
      return;
    }
    const saved = await saveClusters(clusters);
    res.json(saved);
  } catch (error: any) {
    console.error('Save clusters error:', error);
    res.status(500).json({ error: error.message || 'Failed to save clusters' });
  }
});

// Delete all clusters (admin only)
router.delete('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await deleteAllClusters();
    res.json({ deleted });
  } catch (error: any) {
    console.error('Delete all clusters error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete clusters' });
  }
});

// Update cluster title (admin only)
router.patch('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const updated = await updateClusterTitle(req.params.id, title.trim());
    if (!updated) {
      res.status(404).json({ error: 'Cluster not found' });
      return;
    }
    res.json(updated);
  } catch (error: any) {
    console.error('Update cluster error:', error);
    res.status(500).json({ error: error.message || 'Failed to update cluster' });
  }
});

export default router;
