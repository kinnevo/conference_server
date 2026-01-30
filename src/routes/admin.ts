import express, { Response } from 'express';
import { getAllProfiles, getProfileStats } from '../services/profileService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';

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

export default router;
