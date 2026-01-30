import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { JwtPayload, TokenPair, RegisterData, LoginData, User, Profile } from '../types';

const JWT_ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET || 'your-access-secret-min-32-chars-change-this';
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-min-32-chars-change-this';
const JWT_ACCESS_EXPIRES_IN: string = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export async function registerUser(data: RegisterData): Promise<{ user: User; profile: Profile }> {
  const { email, password, firstName, lastName, company, jobTitle, attendeeType } = data;

  // Check if user already exists
  const existingUser = await pool.query('SELECT id FROM public.users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Start transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
      'INSERT INTO public.users (email, password_hash) VALUES ($1, $2) RETURNING *',
      [email, passwordHash]
    );
    const user = userResult.rows[0];

    // Create profile
    const profileResult = await client.query(
      `INSERT INTO public.profiles (id, email, first_name, last_name, company, job_title, attendee_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user.id, email, firstName, lastName, company || null, jobTitle || null, attendeeType]
    );
    const profile = profileResult.rows[0];

    await client.query('COMMIT');
    return { user, profile };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function loginUser(data: LoginData): Promise<{ tokens: TokenPair; user: User; profile: Profile }> {
  const { email, password } = data;

  // Get user
  const userResult = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
  if (userResult.rows.length === 0) {
    throw new Error('Invalid credentials');
  }
  const user = userResult.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Get profile
  const profileResult = await pool.query('SELECT * FROM public.profiles WHERE id = $1', [user.id]);
  const profile = profileResult.rows[0];

  // Generate tokens
  const tokens = await generateTokenPair(user.id, email, profile.is_admin);

  return { tokens, user, profile };
}

export async function generateTokenPair(userId: string, email: string, isAdmin: boolean): Promise<TokenPair> {
  const payload: JwtPayload = { userId, email, isAdmin };

  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN } as any);
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as any);

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await pool.query(
    'INSERT INTO public.refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, refreshToken, expiresAt]
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;

    // Check if token exists in database and hasn't expired
    const result = await pool.query(
      'SELECT * FROM public.refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired refresh token');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await pool.query('DELETE FROM public.refresh_tokens WHERE token = $1', [token]);
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await pool.query('DELETE FROM public.refresh_tokens WHERE user_id = $1', [userId]);
}

export async function getUserById(userId: string): Promise<{ user: User; profile: Profile } | null> {
  const userResult = await pool.query('SELECT * FROM public.users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    return null;
  }

  const profileResult = await pool.query('SELECT * FROM public.profiles WHERE id = $1', [userId]);

  return {
    user: userResult.rows[0],
    profile: profileResult.rows[0]
  };
}
