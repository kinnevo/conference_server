-- LLM Provider Configurations Migration
-- This migration adds tables for managing LLM provider configurations

-- LLM Provider Configurations table
CREATE TABLE IF NOT EXISTS llm_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,
    api_key_encrypted TEXT,
    api_key_iv TEXT,
    base_url VARCHAR(255),
    model VARCHAR(100),
    max_tokens INTEGER DEFAULT 4000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    settings JSONB,
    last_test_at TIMESTAMPTZ,
    last_test_status VARCHAR(20),
    last_test_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_temperature CHECK (temperature >= 0 AND temperature <= 2)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_llm_providers_active ON llm_providers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_llm_providers_enabled ON llm_providers(is_enabled) WHERE is_enabled = TRUE;

-- Insert default providers (all disabled by default)
INSERT INTO llm_providers (name, display_name, model, is_enabled, is_active) VALUES
    ('openai', 'ChatGPT (OpenAI)', 'gpt-4o', FALSE, FALSE),
    ('groq', 'Groq', 'llama-3.1-70b-versatile', FALSE, FALSE),
    ('anthropic', 'Claude (Anthropic)', 'claude-3-5-sonnet-20241022', FALSE, FALSE),
    ('google', 'Gemini (Google)', 'gemini-1.5-pro', FALSE, FALSE)
ON CONFLICT (name) DO NOTHING;
