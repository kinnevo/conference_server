import express, { Response } from 'express';
import { getProfile, updateProfile } from '../services/profileService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { profileUpdateValidation } from '../middleware/validation';
import { AuthRequest } from '../types';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get own profile
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const profile = await getProfile(req.user.userId);

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({
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
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update own profile
router.put('/me', profileUpdateValidation, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const updateData: any = {};
    if (req.body.firstName !== undefined) updateData.first_name = req.body.firstName;
    if (req.body.lastName !== undefined) updateData.last_name = req.body.lastName;
    if (req.body.company !== undefined) updateData.company = req.body.company;
    if (req.body.jobTitle !== undefined) updateData.job_title = req.body.jobTitle;
    if (req.body.attendeeType !== undefined) updateData.attendee_type = req.body.attendeeType;

    const profile = await updateProfile(req.user.userId, updateData);

    res.json({
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
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile by ID (admin only)
router.get('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await getProfile(req.params.id);

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({
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
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
