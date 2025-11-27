/*
  # Remove Duplicate Indexes

  1. Changes
    - Remove duplicate indexes that cover the same columns
    - Keep the most descriptive index name
    - Improves write performance and reduces storage
  
  2. Duplicates Found
    - hall_of_fame: idx_hall_of_fame_user and idx_hall_of_fame_user_id
    - user_profiles: idx_user_profiles_user_id and user_profiles_user_id_idx
*/

-- Hall of Fame - keep idx_hall_of_fame_user_id (more descriptive)
DROP INDEX IF EXISTS idx_hall_of_fame_user;

-- User Profiles - keep user_profiles_user_id_idx (follows naming convention)
DROP INDEX IF EXISTS idx_user_profiles_user_id;
