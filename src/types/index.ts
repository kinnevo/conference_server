import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  job_title: string | null;
  attendee_type: 'general' | 'speaker' | 'sponsor' | 'vip';
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Area {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  attendeeType: 'general' | 'speaker' | 'sponsor' | 'vip';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LLMProvider {
  id: string;
  name: 'openai' | 'groq' | 'anthropic' | 'google';
  display_name: string;
  is_enabled: boolean;
  is_active: boolean;
  api_key_encrypted?: string;
  api_key_iv?: string;
  api_key_masked?: string; // e.g., "sk-...****"
  base_url?: string;
  model: string;
  max_tokens: number;
  temperature: number;
  settings?: any;
  last_test_at?: Date;
  last_test_status?: 'success' | 'failed' | 'pending';
  last_test_error?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LLMProviderConfig {
  api_key: string;
  model: string;
  max_tokens?: number;
  temperature?: number;
  base_url?: string;
}

export interface LLMTestResult {
  success: boolean;
  message: string;
  response_time_ms?: number;
  error?: string;
}
