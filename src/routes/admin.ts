import express, { Response } from 'express';
import { getAllProfiles, getProfileStats } from '../services/profileService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import { getSignalSourceMode, setSignalSourceMode } from '../services/systemSettingsService';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Get all profiles
router.get('/profiles', async (req: AuthRequest, res: Response) => {
  try {
    const profiles = await getAllProfiles();

    const formattedProfiles = profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      company: profile.company,
      jobTitle: profile.job_title,
      attendeeType: profile.attendee_type,
      isAdmin: profile.is_admin,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }));

    res.json(formattedProfiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get registration stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getProfileStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get global signal source mode
router.get('/signal-source-mode', async (req: AuthRequest, res: Response) => {
  try {
    const mode = await getSignalSourceMode();
    res.json({ mode });
  } catch (error: any) {
    console.error('Get signal source mode error:', error);
    res.status(500).json({ error: error.message || 'Failed to get signal source mode' });
  }
});

// Set global signal source mode (admin only)
router.post('/signal-source-mode', async (req: AuthRequest, res: Response) => {
  try {
    const { mode } = req.body;

    if (!mode || (mode !== 'live' && mode !== 'demo')) {
      res.status(400).json({ error: 'Invalid mode. Must be "live" or "demo".' });
      return;
    }

    await setSignalSourceMode(mode);
    console.log(`[ADMIN] Signal source mode updated to: ${mode} by user: ${req.user?.userId}`);
    res.json({ mode, message: 'Signal source mode updated successfully' });
  } catch (error: any) {
    console.error('Set signal source mode error:', error);
    res.status(500).json({ error: error.message || 'Failed to set signal source mode' });
  }
});

export default router;
