/*
  # Create API Keys Table

  1. New Table: api_keys
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `tenant_id` (uuid, references tenants)
    - `name` (text, user-friendly name)
    - `token_hash` (text, SHA-256 hash of API key)
    - `scopes` (text[], permissions array)
    - `is_active` (boolean, can be deactivated)
    - `last_used_at` (timestamptz, nullable)
    - `created_at` (timestamptz)
    - `revoked_at` (timestamptz, nullable)

  2. Security
    - RLS will be enabled
    - Only Master/Admin can manage API keys
    - Tokens are stored as SHA-256 hashes only
    - No plaintext tokens in database

  3. Notes
    - API keys are tenant-scoped
    - Supports multiple scopes for fine-grained access control
    - Tracks last usage for auditing
*/

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants (id) ON DELETE SET NULL,
  name text NOT NULL,
  token_hash text NOT NULL,
  scopes text[] DEFAULT ARRAY['training:read', 'training:write']::text[],
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON public.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_token_hash ON public.api_keys(token_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON public.api_keys(created_at DESC);
