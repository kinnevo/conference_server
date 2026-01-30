import pool from '../config/database';
import { Area } from '../types';

export async function getAllAreas(): Promise<Area[]> {
  const result = await pool.query('SELECT * FROM areas_of_interest ORDER BY name ASC');
  return result.rows;
}

export async function getAreaById(id: string): Promise<Area | null> {
  const result = await pool.query('SELECT * FROM areas_of_interest WHERE id = $1', [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function createArea(name: string): Promise<Area> {
  const result = await pool.query(
    'INSERT INTO areas_of_interest (name) VALUES ($1) RETURNING *',
    [name]
  );
  return result.rows[0];
}

export async function updateArea(id: string, name: string): Promise<Area> {
  const result = await pool.query(
    'UPDATE areas_of_interest SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [name, id]
  );

  if (result.rows.length === 0) {
    throw new Error('Area not found');
  }

  return result.rows[0];
}

export async function deleteArea(id: string): Promise<void> {
  const result = await pool.query('DELETE FROM areas_of_interest WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new Error('Area not found');
  }
}
