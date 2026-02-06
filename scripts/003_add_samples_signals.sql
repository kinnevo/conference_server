-- samples_signals table for DEMO mode - same schema as signals
CREATE TABLE IF NOT EXISTS samples_signals (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT,
    field_of_interest VARCHAR(200),
    title VARCHAR(300),
    description TEXT,
    qualification_level VARCHAR(20) CHECK (qualification_level IN ('valid', 'weak', 'not-a-signal')),
    validation_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_samples_signals_user ON samples_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_samples_signals_field ON samples_signals(field_of_interest);
CREATE INDEX IF NOT EXISTS idx_samples_signals_created ON samples_signals(created_at DESC);
