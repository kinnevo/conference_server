-- Fix signals and samples_signals tables: ensure PRIMARY KEY constraint exists on id column
-- This fixes the "no unique or exclusion constraint matching ON CONFLICT" error

-- Fix signals table
ALTER TABLE signals DROP CONSTRAINT IF EXISTS signals_pkey;
ALTER TABLE signals ADD PRIMARY KEY (id);

-- Fix samples_signals table
ALTER TABLE samples_signals DROP CONSTRAINT IF EXISTS samples_signals_pkey;
ALTER TABLE samples_signals ADD PRIMARY KEY (id);

-- Verify the constraints
SELECT 'signals' AS table_name, conname, contype
FROM pg_constraint
WHERE conrelid = 'signals'::regclass AND contype = 'p'
UNION ALL
SELECT 'samples_signals' AS table_name, conname, contype
FROM pg_constraint
WHERE conrelid = 'samples_signals'::regclass AND contype = 'p';
