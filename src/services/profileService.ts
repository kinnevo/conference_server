import pool from '../config/database';
import { Profile } from '../types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const result = await pool.query('SELECT * FROM public.profiles WHERE id = $1', [userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function updateProfile(
  userId: string,
  data: Partial<Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>>
): Promise<Profile> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.first_name !== undefined) {
    fields.push(`first_name = $${paramIndex++}`);
    values.push(data.first_name);
  }
  if (data.last_name !== undefined) {
    fields.push(`last_name = $${paramIndex++}`);
    values.push(data.last_name);
  }
  if (data.company !== undefined) {
    fields.push(`company = $${paramIndex++}`);
    values.push(data.company);
  }
  if (data.job_title !== undefined) {
    fields.push(`job_title = $${paramIndex++}`);
    values.push(data.job_title);
  }
  if (data.attendee_type !== undefined) {
    fields.push(`attendee_type = $${paramIndex++}`);
    values.push(data.attendee_type);
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const query = `
    UPDATE public.profiles
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getAllProfiles(): Promise<Profile[]> {
  const result = await pool.query('SELECT * FROM public.profiles ORDER BY created_at DESC');
  return result.rows;
}

export async function getProfileStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  admins: number;
}> {
  const totalResult = await pool.query('SELECT COUNT(*) as count FROM public.profiles');
  const total = parseInt(totalResult.rows[0].count);

  const typeResult = await pool.query(
    'SELECT attendee_type, COUNT(*) as count FROM public.profiles GROUP BY attendee_type'
  );
  const byType: Record<string, number> = {};
  typeResult.rows.forEach(row => {
    byType[row.attendee_type] = parseInt(row.count);
  });

  const adminResult = await pool.query('SELECT COUNT(*) as count FROM public.profiles WHERE is_admin = true');
  const admins = parseInt(adminResult.rows[0].count);

  return { total, byType, admins };
}
