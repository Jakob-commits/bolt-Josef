/*
  # Add package column to profiles table

  1. Changes
    - Add `package` column to profiles table
      - Type: text
      - Default: 'starter'
      - Valid values: 'starter', 'premium', 'pro'
    - Set existing users to 'starter' if NULL
    - Add check constraint for valid values

  2. Security
    - Users can read their own package
    - Users can update their own package (for upgrade flow)
*/

-- Add package column with default value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'package'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN package text DEFAULT 'starter';
  END IF;
END $$;

-- Add check constraint for valid package values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_package_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_package_check 
    CHECK (package IN ('starter', 'premium', 'pro'));
  END IF;
END $$;

-- Update any NULL values to 'starter'
UPDATE profiles 
SET package = 'starter' 
WHERE package IS NULL;

-- Make package NOT NULL after setting defaults
ALTER TABLE profiles 
ALTER COLUMN package SET NOT NULL;

-- Create index for faster package queries
CREATE INDEX IF NOT EXISTS idx_profiles_package 
ON profiles(package);
