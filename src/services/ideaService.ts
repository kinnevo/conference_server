import pool from '../config/database';

export interface IdeaRow {
  id: string;
  opportunity_id: string;
  user_id: string;
  idea_input: string;
  result: string;
  created_at: string;
  updated_at: string;
}

export async function createIdea(data: {
  opportunityId: string;
  userId: string;
  ideaInput: string;
  result: string;
}): Promise<IdeaRow> {
  const result = await pool.query(
    `INSERT INTO ideas (opportunity_id, user_id, idea_input, result)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.opportunityId, data.userId, data.ideaInput, data.result]
  );
  return result.rows[0];
}

export async function getIdeasByOpportunity(opportunityId: string): Promise<IdeaRow[]> {
  const result = await pool.query(
    'SELECT * FROM ideas WHERE opportunity_id = $1 ORDER BY created_at DESC',
    [opportunityId]
  );
  return result.rows;
}

export async function getIdeasByUser(userId: string): Promise<IdeaRow[]> {
  const result = await pool.query(
    'SELECT * FROM ideas WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function getAllIdeas(): Promise<IdeaRow[]> {
  const result = await pool.query(
    'SELECT * FROM ideas ORDER BY created_at DESC'
  );
  return result.rows;
}
