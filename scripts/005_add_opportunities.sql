-- Opportunities table for saved opportunities from clusters
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    user_request TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_cluster ON opportunities(cluster_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_created ON opportunities(created_at DESC);
