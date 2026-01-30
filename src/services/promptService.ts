import pool from '../config/database';
import { Prompt } from '../types';

export async function getAllPrompts(): Promise<Prompt[]> {
  const result = await pool.query(
    'SELECT * FROM prompts ORDER BY name ASC'
  );
  return result.rows;
}

export async function getPromptById(id: string): Promise<Prompt | null> {
  const result = await pool.query(
    'SELECT * FROM prompts WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getPromptByName(name: string): Promise<Prompt | null> {
  const result = await pool.query(
    'SELECT * FROM prompts WHERE name = $1',
    [name]
  );
  return result.rows[0] || null;
}

export async function updatePrompt(id: string, content: string): Promise<Prompt> {
  const result = await pool.query(
    'UPDATE prompts SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [content, id]
  );

  if (result.rows.length === 0) {
    throw new Error('Prompt not found');
  }

  return result.rows[0];
}

export async function createPrompt(name: string, content: string, description?: string): Promise<Prompt> {
  const result = await pool.query(
    'INSERT INTO prompts (name, content, description) VALUES ($1, $2, $3) RETURNING *',
    [name, content, description || null]
  );
  return result.rows[0];
}

export async function deletePrompt(id: string): Promise<void> {
  const result = await pool.query(
    'DELETE FROM prompts WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Prompt not found');
  }
}
