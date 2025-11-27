/*
  # Add Account Status and Manager to Profiles

  1. Changes
    - Add `account_status` column to profiles table
      - Values: 'active', 'pending', 'paused', 'archived'
      - Default: 'active'
    - Add `manager_id` column to profiles table
      - References profiles(id) for hierarchical management
      - Nullable (not all users need a manager)
    
  2. Security
    - No RLS changes needed - existing policies cover these fields
    - Manager relationship enables leadership hierarchy tracking
    
  3. Important Notes
    - Account status controls user access and visibility
    - Manager field enables reporting and team structure
    - Existing users will default to 'active' status
*/

-- Add account_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active';
    
    -- Add check constraint for valid status values
    ALTER TABLE profiles ADD CONSTRAINT profiles_account_status_check 
      CHECK (account_status IN ('active', 'pending', 'paused', 'archived'));
    
    -- Add index for filtering by status
    CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);
  END IF;
END $$;

-- Add manager_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'manager_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN manager_id UUID;
    
    -- Add foreign key constraint
    ALTER TABLE profiles ADD CONSTRAINT profiles_manager_id_fkey 
      FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    -- Add index for manager lookups
    CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON profiles(manager_id);
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN profiles.account_status IS 'User account status: active, pending, paused, or archived';
COMMENT ON COLUMN profiles.manager_id IS 'Reference to manager/supervisor for hierarchical reporting';
