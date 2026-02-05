import pool from '../config/database';
import { LLMProvider, LLMProviderConfig } from '../types';
import { encrypt, decrypt, maskApiKey } from './encryptionService';

export async function getAllProviders(): Promise<LLMProvider[]> {
  const result = await pool.query(
    'SELECT * FROM llm_providers ORDER BY name ASC'
  );

  return result.rows.map(row => ({
    ...row,
    api_key_masked: row.api_key_encrypted ? maskApiKey(getDecryptedKey(row)) : undefined,
    api_key_encrypted: undefined, // Never send encrypted key to client
    api_key_iv: undefined
  }));
}

export async function getProviderById(id: string): Promise<LLMProvider | null> {
  const result = await pool.query(
    'SELECT * FROM llm_providers WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    ...row,
    api_key_masked: row.api_key_encrypted ? maskApiKey(getDecryptedKey(row)) : undefined,
    api_key_encrypted: undefined,
    api_key_iv: undefined
  };
}

// Internal function: Get provider WITH encrypted data (for backend use only)
export async function getProviderByIdInternal(id: string): Promise<any | null> {
  const result = await pool.query(
    'SELECT * FROM llm_providers WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

export async function getActiveProvider(): Promise<LLMProvider | null> {
  const result = await pool.query(
    'SELECT * FROM llm_providers WHERE is_active = TRUE LIMIT 1'
  );

  return result.rows[0] || null;
}

export async function configureProvider(
  id: string,
  config: LLMProviderConfig
): Promise<LLMProvider> {
  const { encrypted, iv, tag } = encrypt(config.api_key);

  const result = await pool.query(
    `UPDATE llm_providers
     SET api_key_encrypted = $1,
         api_key_iv = $2,
         model = $3,
         max_tokens = $4,
         temperature = $5,
         base_url = $6,
         is_enabled = TRUE,
         updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      encrypted + ':' + tag,
      iv,
      config.model,
      config.max_tokens || 4000,
      config.temperature || 0.7,
      config.base_url || null,
      id
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Provider not found');
  }

  return result.rows[0];
}

export async function activateProvider(id: string): Promise<LLMProvider> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Deactivate all providers
    await client.query('UPDATE llm_providers SET is_active = FALSE');

    // Activate the selected provider
    const result = await client.query(
      'UPDATE llm_providers SET is_active = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    await client.query('COMMIT');

    if (result.rows.length === 0) {
      throw new Error('Provider not found');
    }

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateTestResult(
  id: string,
  success: boolean,
  error?: string
): Promise<void> {
  await pool.query(
    `UPDATE llm_providers
     SET last_test_at = NOW(),
         last_test_status = $1,
         last_test_error = $2
     WHERE id = $3`,
    [success ? 'success' : 'failed', error || null, id]
  );
}

function getDecryptedKey(row: any): string {
  if (!row.api_key_encrypted || !row.api_key_iv) return '';

  const [encrypted, tag] = row.api_key_encrypted.split(':');
  return decrypt(encrypted, row.api_key_iv, tag);
}

export function getProviderApiKey(provider: LLMProvider): string {
  if (!provider.api_key_encrypted || !provider.api_key_iv) {
    throw new Error('API key not configured');
  }

  const [encrypted, tag] = provider.api_key_encrypted.split(':');
  return decrypt(encrypted, provider.api_key_iv, tag);
}
