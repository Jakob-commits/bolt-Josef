/*
  # Challenge Schema Improvements
  
  1. Changes
    - Add `start_at` column to challenges table for tracking when challenge becomes active
    - Add `accepted_at` column to track when opponent accepts
    - Ensure `expires_at` defaults to 7 days from creation
    - Add helpful indexes for performance
    
  2. Notes
    - Existing challenges remain unchanged
    - New challenges will have proper start/end tracking
*/

-- Add start_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'start_at'
  ) THEN
    ALTER TABLE challenges ADD COLUMN start_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add accepted_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE challenges ADD COLUMN accepted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update existing challenges without start_at to use created_at
UPDATE challenges 
SET start_at = created_at 
WHERE start_at IS NULL AND status NOT IN ('pending', 'declined');

-- Update existing challenges without expires_at to use 7 days from creation
UPDATE challenges 
SET expires_at = created_at + interval '7 days'
WHERE expires_at IS NULL;

-- Create index for efficient querying by user and status
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_status 
  ON challenges(challenger_id, status);

CREATE INDEX IF NOT EXISTS idx_challenges_opponent_status 
  ON challenges(opponent_id, status);

-- Create index for expiration queries
CREATE INDEX IF NOT EXISTS idx_challenges_expires_at 
  ON challenges(expires_at) 
  WHERE status IN ('pending', 'active');

-- Add comment for documentation
COMMENT ON COLUMN challenges.start_at IS 'Timestamp when challenge becomes active (typically when accepted)';
COMMENT ON COLUMN challenges.accepted_at IS 'Timestamp when opponent accepted the challenge';
COMMENT ON COLUMN challenges.expires_at IS 'Challenge expiration time (default: 7 days from start)';
