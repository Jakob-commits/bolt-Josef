/*
  # Add Missing Foreign Keys
  
  1. Changes
    - Add foreign keys from challenges to profiles table
      - challenger_id -> profiles(id)
      - opponent_id -> profiles(id)
      - winner_id -> profiles(id)
      - loser_id -> profiles(id)
    - Add foreign key from hall_of_fame to profiles table
      - user_id -> profiles(id)
    
  2. Security
    - All foreign keys use ON DELETE CASCADE for data consistency
    - Enables proper JOIN queries in Supabase
*/

-- Add foreign keys for challenges table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'challenges_challenger_id_fkey'
  ) THEN
    ALTER TABLE challenges 
      ADD CONSTRAINT challenges_challenger_id_fkey 
      FOREIGN KEY (challenger_id) 
      REFERENCES profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'challenges_opponent_id_fkey'
  ) THEN
    ALTER TABLE challenges 
      ADD CONSTRAINT challenges_opponent_id_fkey 
      FOREIGN KEY (opponent_id) 
      REFERENCES profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'challenges_winner_id_fkey'
  ) THEN
    ALTER TABLE challenges 
      ADD CONSTRAINT challenges_winner_id_fkey 
      FOREIGN KEY (winner_id) 
      REFERENCES profiles(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'challenges_loser_id_fkey'
  ) THEN
    ALTER TABLE challenges 
      ADD CONSTRAINT challenges_loser_id_fkey 
      FOREIGN KEY (loser_id) 
      REFERENCES profiles(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key for hall_of_fame table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'hall_of_fame_user_id_fkey'
  ) THEN
    ALTER TABLE hall_of_fame 
      ADD CONSTRAINT hall_of_fame_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_user_id 
  ON hall_of_fame(user_id);

-- Comments for documentation
COMMENT ON CONSTRAINT challenges_challenger_id_fkey ON challenges 
  IS 'Links challenger to their profile';
COMMENT ON CONSTRAINT challenges_opponent_id_fkey ON challenges 
  IS 'Links opponent to their profile';
COMMENT ON CONSTRAINT challenges_winner_id_fkey ON challenges 
  IS 'Links winner to their profile (nullable)';
COMMENT ON CONSTRAINT challenges_loser_id_fkey ON challenges 
  IS 'Links loser to their profile (nullable)';
COMMENT ON CONSTRAINT hall_of_fame_user_id_fkey ON hall_of_fame 
  IS 'Links hall of fame entry to user profile';
