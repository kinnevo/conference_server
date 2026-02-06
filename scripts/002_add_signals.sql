-- Signals table for persisting validated signals from all users
CREATE TABLE IF NOT EXISTS signals (
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

CREATE INDEX IF NOT EXISTS idx_signals_user ON signals(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_field ON signals(field_of_interest);
CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created_at DESC);
