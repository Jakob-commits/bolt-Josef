/*
  # Create user_layouts table for dashboard customization

  1. New Tables
    - `user_layouts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `layout` (jsonb) - stores the layout configuration as JSON
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_layouts` table
    - Add policy for authenticated users to read their own layout
    - Add policy for authenticated users to insert their own layout
    - Add policy for authenticated users to update their own layout
*/

CREATE TABLE IF NOT EXISTS user_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own layout"
  ON user_layouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own layout"
  ON user_layouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own layout"
  ON user_layouts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_layouts_user_id_idx ON user_layouts(user_id);
