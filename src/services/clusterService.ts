import pool from '../config/database';

export interface ClusterRow {
  id: string;
  title: string;
  insight: string;
  strength: string;
  signal_ids: string[];
  pattern_tags: string[];
  opportunity_preview: {
    whoIsStruggling?: string;
    desiredOutcome?: string;
    whatBreaks?: string;
    costOfInaction?: string;
  };
  signal_snapshots: Array<{
    id: string;
    description?: string;
    qualificationLevel?: string;
    signalTypes?: string[];
    reasoning?: string[];
    metrics?: string[];
  }>;
  created_at: string;
  updated_at: string;
}

export interface SaveClusterInput {
  id: string;
  title: string;
  insight: string;
  strength: string;
  signalIds: string[];
  patternTags: string[];
  opportunityPreview: {
    whoIsStruggling?: string;
    desiredOutcome?: string;
    whatBreaks?: string;
    costOfInaction?: string;
  };
  signalSnapshots: Array<{
    id: string;
    description?: string;
    qualificationLevel?: string;
    signalTypes?: string[];
    reasoning?: string[];
    metrics?: string[];
  }>;
}

export async function saveClusters(clusters: SaveClusterInput[]): Promise<ClusterRow[]> {
  const saved: ClusterRow[] = [];
  for (const c of clusters) {
    const result = await pool.query(
      `INSERT INTO clusters (id, title, insight, strength, signal_ids, pattern_tags, opportunity_preview, signal_snapshots)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         insight = EXCLUDED.insight,
         strength = EXCLUDED.strength,
         signal_ids = EXCLUDED.signal_ids,
         pattern_tags = EXCLUDED.pattern_tags,
         opportunity_preview = EXCLUDED.opportunity_preview,
         signal_snapshots = EXCLUDED.signal_snapshots,
         updated_at = NOW()
       RETURNING *`,
      [
        c.id,
        c.title,
        c.insight || '',
        c.strength || 'medium',
        c.signalIds || [],
        c.patternTags || [],
        JSON.stringify(c.opportunityPreview || {}),
        JSON.stringify(c.signalSnapshots || [])
      ]
    );
    saved.push(result.rows[0]);
  }
  return saved;
}

export async function getAllClusters(): Promise<ClusterRow[]> {
  const result = await pool.query(
    `SELECT * FROM clusters ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function updateClusterTitle(id: string, title: string): Promise<ClusterRow | null> {
  const result = await pool.query(
    `UPDATE clusters SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [title, id]
  );
  return result.rows[0] || null;
}

export async function deleteAllClusters(): Promise<number> {
  const result = await pool.query('DELETE FROM clusters');
  return result.rowCount ?? 0;
}
