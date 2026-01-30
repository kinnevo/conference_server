-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(200),
    job_title VARCHAR(200),
    attendee_type VARCHAR(20) DEFAULT 'general' CHECK (attendee_type IN ('general', 'speaker', 'sponsor', 'vip')),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Areas of interest table
CREATE TABLE IF NOT EXISTS areas_of_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens table (for JWT refresh)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    description VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Insert default prompts
INSERT INTO prompts (name, content, description) VALUES
    ('signal_analysis', 'Analyze the following signals and provide insights...', 'Prompt for analyzing market signals'),
    ('cluster_generation', 'Generate clusters based on the following data...', 'Prompt for generating data clusters'),
    ('opportunity_scoring', 'Score the following opportunities based on...', 'Prompt for scoring business opportunities'),
    ('summary_generation', 'Generate a summary of the following information...', 'Prompt for generating summaries')
ON CONFLICT (name) DO NOTHING;

-- Insert default areas
INSERT INTO areas_of_interest (name) VALUES
    ('Healthcare'),
    ('Education'),
    ('Finance'),
    ('Technology'),
    ('Agriculture')
ON CONFLICT (name) DO NOTHING;
