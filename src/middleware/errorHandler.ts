import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('Error:', err);

  // Handle specific error types
  if (err.message === 'User already exists') {
    res.status(409).json({ error: err.message });
    return;
  }

  if (err.message === 'Invalid credentials') {
    res.status(401).json({ error: err.message });
    return;
  }

  if (err.message === 'Invalid or expired token' || err.message === 'Invalid or expired refresh token') {
    res.status(401).json({ error: err.message });
    return;
  }

  if (err.message === 'Area not found' || err.message === 'Profile not found') {
    res.status(404).json({ error: err.message });
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({ error: err.message, details: err.details });
    return;
  }

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    res.status(409).json({ error: 'Duplicate entry' });
    return;
  }

  if (err.code === '23503') { // Foreign key violation
    res.status(400).json({ error: 'Invalid reference' });
    return;
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}
