import pool from '../config/database';

export type SignalSourceMode = 'live' | 'demo';

/**
 * Get the global signal source mode setting
 * Returns 'live' or 'demo'
 */
export async function getSignalSourceMode(): Promise<SignalSourceMode> {
  try {
    const result = await pool.query(
      'SELECT value FROM public.system_settings WHERE key = $1',
      ['signal_source_mode']
    );

    if (result.rows.length === 0) {
      // Default to 'live' if not found
      return 'live';
    }

    const mode = result.rows[0].value;
    return mode === 'demo' ? 'demo' : 'live';
  } catch (error) {
    console.error('[SETTINGS] Error fetching signal source mode:', error);
    // Default to 'live' on error
    return 'live';
  }
}

/**
 * Set the global signal source mode setting (admin only)
 */
export async function setSignalSourceMode(mode: SignalSourceMode): Promise<void> {
  if (mode !== 'live' && mode !== 'demo') {
    throw new Error('Invalid signal source mode. Must be "live" or "demo".');
  }

  await pool.query(
    `INSERT INTO public.system_settings (key, value, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [
      'signal_source_mode',
      mode,
      'Signal source mode: live (signals table) or demo (samples_signals table)'
    ]
  );

  console.log(`[SETTINGS] Signal source mode updated to: ${mode}`);
}

/**
 * Get a system setting by key
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const result = await pool.query(
      'SELECT value FROM public.system_settings WHERE key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].value;
  } catch (error) {
    console.error(`[SETTINGS] Error fetching setting ${key}:`, error);
    return null;
  }
}

/**
 * Set a system setting
 */
export async function setSystemSetting(
  key: string,
  value: string,
  description?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO public.system_settings (key, value, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value, description || null]
  );
}
