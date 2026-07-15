-- Migration: 014_add_review_admin_role
-- Purpose: Safely and idempotently add 'review_admin' to the app_role enum type.
-- Assumptions: The app_role enum type exists in the database.
-- Transactional: No (PostgreSQL does not allow ALTER TYPE ... ADD VALUE inside a transaction block).
-- Dependencies: None.
-- Expected Production Impact: Minimal. Adds a new allowed role value to the enum type.

-- Idempotently add 'review_admin' value to the public.app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'review_admin';
