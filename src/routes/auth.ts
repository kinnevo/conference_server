import express, { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  verifyRefreshToken,
  generateTokenPair,
  revokeRefreshToken,
  revokeAllUserTokens,
  getUserById
} from '../services/authService';
import { authenticateToken } from '../middleware/auth';
import { registerValidation, loginValidation } from '../middleware/validation';
import { AuthRequest } from '../types';

const router = express.Router();

// Register new user
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    const { user, profile } = await registerUser(req.body);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email
      },
      profile: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        company: profile.company,
        jobTitle: profile.job_title,
        attendeeType: profile.attendee_type,
        isAdmin: profile.is_admin
      }
    });
  } catch (error: any) {
    const status = error.message === 'User already exists' ? 409 : 400;
    res.status(status).json({ error: error.message });
  }
});

// Login user
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    const { tokens, user, profile } = await loginUser(req.body);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        company: profile.company,
        jobTitle: profile.job_title,
        attendeeType: profile.attendee_type,
        isAdmin: profile.is_admin
      }
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Refresh access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    console.log('[AUTH] Refresh token request received at', new Date().toISOString());
    const { refreshToken } = req.body;

    if (!refreshToken) {
      console.warn('[AUTH] Refresh request missing token');
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const payload = await verifyRefreshToken(refreshToken);

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Generate new token pair
    const tokens = await generateTokenPair(payload.userId, payload.email, payload.isAdmin);

    console.log(`[AUTH] Token refresh successful for user: ${payload.userId}`);
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error: any) {
    console.error('[AUTH] Token refresh failed:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(401).json({ error: error.message });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    } else if (req.user) {
      // If no specific refresh token provided, revoke all user tokens
      await revokeAllUserTokens(req.user.userId);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await getUserById(req.user.userId);

    if (!result) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { user, profile } = result;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        company: profile.company,
        jobTitle: profile.job_title,
        attendeeType: profile.attendee_type,
        isAdmin: profile.is_admin
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
