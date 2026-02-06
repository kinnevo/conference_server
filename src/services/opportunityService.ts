import pool from '../config/database';

export interface OpportunityRow {
  id: string;
  cluster_id: string | null;
  title: string;
  content: string;
  user_request: string | null;
  created_at: string;
  updated_at: string;
}

export async function createOpportunity(data: {
  clusterId?: string;
  title: string;
  content: string;
  userRequest?: string;
}): Promise<OpportunityRow> {
  const result = await pool.query(
    `INSERT INTO opportunities (cluster_id, title, content, user_request)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.clusterId || null, data.title, data.content, data.userRequest || null]
  );
  return result.rows[0];
}

export async function getAllOpportunities(): Promise<OpportunityRow[]> {
  const result = await pool.query(
    'SELECT * FROM opportunities ORDER BY created_at DESC'
  );
  return result.rows;
}
