-- Migration to add imis_id to the businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS imis_id text;

-- Create an index to speed up the verifyImisId query
CREATE INDEX IF NOT EXISTS idx_businesses_imis_id ON businesses(imis_id);
