import pool from '../config/database';

export type SignalTable = 'signals' | 'samples_signals';

export interface SignalRow {
  id: string;
  user_id: string;
  session_id: string | null;
  field_of_interest: string | null;
  title: string | null;
  description: string | null;
  qualification_level: string | null;
  validation_result: any;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

function getTable(mode?: string): SignalTable {
  return mode === 'demo' ? 'samples_signals' : 'signals';
}

export async function saveSignal(signal: {
  id: string;
  userId: string;
  sessionId?: string;
  fieldOfInterest?: string;
  title?: string;
  description?: string;
  qualificationLevel?: string;
  validationResult?: any;
}, mode?: string): Promise<SignalRow> {
  const table = getTable(mode);
  const result = await pool.query(
    `INSERT INTO ${table} (id, user_id, session_id, field_of_interest, title, description, qualification_level, validation_result)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       field_of_interest = EXCLUDED.field_of_interest,
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       qualification_level = EXCLUDED.qualification_level,
       validation_result = EXCLUDED.validation_result,
       updated_at = NOW()
     RETURNING *`,
    [
      signal.id,
      signal.userId,
      signal.sessionId || null,
      signal.fieldOfInterest || null,
      signal.title || null,
      signal.description || null,
      signal.qualificationLevel || null,
      signal.validationResult ? JSON.stringify(signal.validationResult) : null
    ]
  );
  return result.rows[0];
}

export async function getAllSignals(mode?: string): Promise<SignalRow[]> {
  const table = getTable(mode);
  const result = await pool.query(
    `SELECT s.*, p.first_name, p.last_name, p.email
     FROM ${table} s
     LEFT JOIN profiles p ON s.user_id = p.id
     ORDER BY s.created_at DESC`
  );
  return result.rows;
}

export async function getUserSignals(userId: string, mode?: string): Promise<SignalRow[]> {
  const table = getTable(mode);
  const result = await pool.query(
    `SELECT s.*, p.first_name, p.last_name, p.email
     FROM ${table} s
     LEFT JOIN profiles p ON s.user_id = p.id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function deleteSignal(id: string, mode?: string): Promise<boolean> {
  const table = getTable(mode);
  const result = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
