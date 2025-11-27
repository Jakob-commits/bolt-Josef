/*
  # Create training_guides table

  1. New Tables
    - `training_guides`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `content` (text) - JSON, Markdown, or prompt building blocks
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `training_guides` table
    - Add policy for users to read their own guides
    - Add policy for users to insert their own guides
    - Add policy for users to update their own guides
    - Add policy for users to delete their own guides
*/

CREATE TABLE IF NOT EXISTS training_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE training_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own guides"
  ON training_guides
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own guides"
  ON training_guides
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own guides"
  ON training_guides
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own guides"
  ON training_guides
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS training_guides_user_id_idx ON training_guides(user_id);
CREATE INDEX IF NOT EXISTS training_guides_created_at_idx ON training_guides(created_at DESC);
