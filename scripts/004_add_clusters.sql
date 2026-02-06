-- Clusters table for persisting generated clusters
CREATE TABLE IF NOT EXISTS clusters (
    id UUID PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    insight TEXT,
    strength VARCHAR(20) CHECK (strength IN ('high', 'medium', 'low')),
    signal_ids TEXT[] NOT NULL DEFAULT '{}',
    pattern_tags TEXT[] NOT NULL DEFAULT '{}',
    opportunity_preview JSONB NOT NULL DEFAULT '{}',
    signal_snapshots JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clusters_created ON clusters(created_at DESC);
